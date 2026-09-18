import type { Request, Response, NextFunction } from 'express';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import * as suggestRepo from '../repositories/suggest.repository.js';
import { invalidateHerbCache } from '../repositories/herb.repository.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { generateEmbedding } from '../services/ai/core/gemini-service.js';
import { prisma } from '../lib/prisma.js';
import { createNotification } from '../repositories/notification.repository.js';
import { sendMail } from '../lib/mailer.js';
import { ENV } from '../config/env.js';
import type { HerbEvidenceClass } from '@prisma/client';
import { editSuggestionSchema, reviewReferencesSchema, suggestHerbSchema } from '../schema/suggest.schema.js';

export class SuggestController {
  public edit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewerId = (req as AuthenticatedRequest).user?.userId;
      const id = Number(req.params.id);
      if (!reviewerId || !Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ status: 'error', message: 'Invalid review request.' });
        return;
      }
      const { body } = editSuggestionSchema.parse({ body: req.body });
      const duplicate = await prisma.herb.findFirst({ where: { OR: [
        { localName: { equals: body.localName, mode: 'insensitive' } },
        { scientificName: { equals: body.scientificName, mode: 'insensitive' } },
      ] }, select: { id: true } });
      if (duplicate) {
        res.status(409).json({ status: 'error', message: 'A herb with this local or scientific name already exists.' });
        return;
      }
      const suggestion = await suggestRepo.editSuggestion(id, reviewerId, body);
      if (!suggestion) {
        res.status(409).json({ status: 'error', message: 'This submission changed or is no longer pending. Refresh before editing.' });
        return;
      }
      res.json({ status: 'success', data: { suggestion }, message: 'Review edits and references saved.' });
    } catch (error) {
      next(error);
    }
  };
  public resubmit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submitterId = (req as AuthenticatedRequest).user?.userId;
      const id = Number(req.params.id);
      if (!submitterId || !Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ status: 'error', message: 'Invalid submission request.' });
        return;
      }
      const original = await suggestRepo.findSuggestionById(id);
      if (!original || original.submitterId !== submitterId) {
        res.status(404).json({ status: 'error', message: 'Submission not found.' });
        return;
      }
      if (original.status !== 'ChangesRequested') {
        res.status(409).json({ status: 'error', message: 'Only submissions with requested changes can be resubmitted.' });
        return;
      }
      const { body } = suggestHerbSchema.parse({ body: req.body });
      const names = [
        { localName: { equals: body.localName, mode: 'insensitive' as const } },
        { scientificName: { equals: body.scientificName, mode: 'insensitive' as const } },
      ];
      const [herb, submission] = await Promise.all([
        prisma.herb.findFirst({ where: { OR: names }, select: { id: true } }),
        prisma.suggestedHerb.findFirst({ where: { id: { not: id }, status: { in: ['Pending', 'ChangesRequested'] }, OR: names }, select: { id: true } }),
      ]);
      if (herb || submission) {
        res.status(409).json({ status: 'error', message: 'Another herb or active submission already uses this local or scientific name.' });
        return;
      }
      const imageUrl = req.file ? await uploadToCloudinary(req.file.buffer) : original.imageUrl;
      const updated = await suggestRepo.resubmitSuggestion(id, submitterId, {
        ...body, imageUrl, cebuanoName: body.cebuanoName ?? '',
        regionFound: body.regionFound ?? '', warnings: body.warnings ?? '',
      });
      if (!updated) {
        res.status(409).json({ status: 'error', message: 'This submission changed. Refresh before trying again.' });
        return;
      }
      res.json({ status: 'success', message: 'Your revised herb is pending review.', data: { suggestion: updated } });
    } catch (error) {
      next(error);
    }
  };
  /**
   * Handle herb suggestions submitted by contributors.
   */
  public suggest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const submitterId = authReq.user?.userId;

      if (!submitterId) {
        res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Authentication required to submit suggestions.',
        });
        return;
      }

      const localNameInput = req.body.localName?.trim();
      const scientificNameInput = req.body.scientificName?.trim();

      if (!localNameInput || !scientificNameInput) {
        res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Local name and scientific name are required.',
        });
        return;
      }

      // Check if it already exists in the Herb library
      const existingHerb = await prisma.herb.findFirst({
        where: {
          OR: [
            { localName: { equals: localNameInput, mode: 'insensitive' } },
            { scientificName: { equals: scientificNameInput, mode: 'insensitive' } }
          ]
        }
      });

      if (existingHerb) {
        res.status(400).json({
          status: 'error',
          code: 400,
          message: `A herb with the name "${localNameInput}" or scientific name "${scientificNameInput}" already exists in the library.`,
        });
        return;
      }

      // Check if a pending suggestion already exists
      const existingPending = await prisma.suggestedHerb.findFirst({
        where: {
          status: { in: ['Pending', 'ChangesRequested'] },
          OR: [
            { localName: { equals: localNameInput, mode: 'insensitive' } },
            { scientificName: { equals: scientificNameInput, mode: 'insensitive' } }
          ]
        }
      });

      if (existingPending) {
        res.status(400).json({
          status: 'error',
          code: 400,
          message: `A pending suggestion for "${localNameInput}" or "${scientificNameInput}" is already under review.`,
        });
        return;
      }

      let imageUrl: string | null = null;

      // If an image was uploaded, upload it to Cloudinary
      if (req.file) {
        imageUrl = await uploadToCloudinary(req.file.buffer);
      }

      // Create suggestion database record
      const suggestion = await suggestRepo.createSuggestion({
        submitterId,
        localName: req.body.localName,
        cebuanoName: req.body.cebuanoName,
        scientificName: req.body.scientificName,
        category: req.body.category,
        medicinalUses: req.body.medicinalUses,
        preparationMethod: req.body.preparationMethod,
        dosage: req.body.dosage,
        regionFound: req.body.regionFound,
        warnings: req.body.warnings,
        informationSource: req.body.informationSource,
        imageUrl,
      });

      res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Herb suggestion submitted successfully for review!',
        data: {
          suggestion,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve suggestions.
   * Admins can view all suggestions; regular contributors only view their own submissions.
   */
  public listSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      const userRole = authReq.user?.role;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Authentication required.',
        });
        return;
      }

      const suggestions = userRole === 'admin'
        ? await suggestRepo.findAllSuggestions()
        : await suggestRepo.findSuggestionsBySubmitter(userId);

      res.status(200).json({
        status: 'success',
        code: 200,
        data: {
          suggestions,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve a suggestion and promote it to an approved Herb.
   */
  public approveSuggestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const reviewerId = authReq.user?.userId;
      const id = parseInt(req.params.id as string, 10);

      if (isNaN(id)) {
        res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid suggestion ID',
        });
        return;
      }

      if (!reviewerId) {
        res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Authentication required.',
        });
        return;
      }

      const suggestion = await suggestRepo.findSuggestionById(id);
      if (!suggestion) {
        res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Suggestion not found.',
        });
        return;
      }

      if (suggestion.status !== 'Pending') {
        res.status(409).json({
          status: 'error',
          code: 409,
          message: `This suggestion is already ${suggestion.status.toLowerCase()}.`,
        });
        return;
      }

      if (!suggestion.informationSource?.trim()) {
        res.status(400).json({
          status: 'error',
          code: 400,
          message: 'A documented information source is required before this suggestion can be approved.',
        });
        return;
      }

      if (!reviewReferencesSchema.safeParse(suggestion.references).success) {
        res.status(400).json({ status: 'error', message: 'Use Edit & references to save at least one complete reference before publishing.' });
        return;
      }
      if (req.body.revision !== suggestion.revision) {
        res.status(409).json({ status: 'error', message: 'This submission changed. Refresh and review the latest version before publishing.' });
        return;
      }

      // Check if herb already exists in the Herb library before approving
      const existingHerb = await prisma.herb.findFirst({
        where: {
          OR: [
            { localName: { equals: suggestion.localName.trim(), mode: 'insensitive' } },
            { scientificName: { equals: suggestion.scientificName.trim(), mode: 'insensitive' } }
          ]
        }
      });

      if (existingHerb) {
        res.status(400).json({
          status: 'error',
          code: 400,
          message: `A herb with the name "${suggestion.localName}" or scientific name "${suggestion.scientificName}" already exists in the library. Cannot approve this suggestion.`,
        });
        return;
      }

      // Generate embedding from herb data
      const textToEmbed = `${suggestion.localName} ${suggestion.scientificName} ${suggestion.category} ${suggestion.medicinalUses} ${suggestion.preparationMethod} ${suggestion.dosage} ${suggestion.warnings ?? ''}`;
      
      let vectorStr: string;
      try {
        const embedding = await generateEmbedding(textToEmbed);
        vectorStr = `[${embedding.join(',')}]`;
      } catch (err) {
        console.error("Embedding generation failed; publication stopped:", err);
        res.status(503).json({
          status: 'error',
          code: 503,
          message: 'The AI search index is temporarily unavailable. Nothing was published; please try again.',
        });
        return;
      }

      // Approve in repository
      const evidenceClass = req.body.evidenceClass as HerbEvidenceClass;
      const reviewNotes = req.body.reviewNotes?.trim() || suggestion.reviewNotes || undefined;
      const herb = await suggestRepo.approveSuggestion(id, reviewerId, vectorStr, evidenceClass, reviewNotes, suggestion.revision);
      if (!herb) {
        res.status(409).json({ status: 'error', message: 'This submission changed or is no longer pending. Refresh and review the latest version.' });
        return;
      }
      invalidateHerbCache();

      // 2. Dispatch submitter notification
      try {
        const notif = await createNotification({
          userId: suggestion.submitterId,
          title: "Herb Suggestion Approved! 🎉",
          message: `Your submitted herb "${suggestion.localName}" (${suggestion.scientificName}) has been approved and published to the Herbal AI Library.`,
          type: "SUGGESTION_UPDATE",
          link: herb ? `/library?id=${encodeURIComponent(herb.id)}` : '/library',
        });

        const { io } = await import("../server.js");
        io.to(suggestion.submitterId).emit("notification", notif);

        const submitter = await prisma.user.findUnique({ where: { id: suggestion.submitterId } });
        if (submitter?.email) {
          sendMail({
            to: submitter.email,
            subject: `${ENV.APP_NAME} - Your Herb Suggestion was Approved!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2d6a4f;">Herb Suggestion Approved!</h2>
                <p>Hello <strong>${submitter.name}</strong>,</p>
                <p>Great news! Your contribution for <strong>${suggestion.localName}</strong> (<em>${suggestion.scientificName}</em>) has been reviewed and approved by our team.</p>
                <p>It is now live in the verified Herbal AI Library for the community to learn from.</p>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">Thank you for preserving Philippine traditional botanical knowledge!</p>
              </div>
            `,
          }).catch((e) => console.error("Failed to send approval email:", e));
        }
      } catch (notifErr) {
        console.error("Failed to deliver notification:", notifErr);
      }

      res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Herb suggestion approved successfully!',
        data: { herb },
      });
    } catch (error) {
      next(error);
    }
  };

  public requestChanges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const reviewerId = authReq.user?.userId;
      const id = parseInt(req.params.id as string, 10);
      const reviewNotes = req.body.reviewNotes?.trim();

      if (!reviewerId) {
        res.status(401).json({ status: 'error', code: 401, message: 'Authentication required.' });
        return;
      }
      if (isNaN(id)) {
        res.status(400).json({ status: 'error', code: 400, message: 'Invalid suggestion ID' });
        return;
      }

      const suggestion = await suggestRepo.findSuggestionById(id);
      if (!suggestion) {
        res.status(404).json({ status: 'error', code: 404, message: 'Suggestion not found.' });
        return;
      }
      if (suggestion.status !== 'Pending') {
        res.status(409).json({ status: 'error', code: 409, message: `This suggestion is already ${suggestion.status.toLowerCase()}. Refresh and review the latest version.` });
        return;
      }

      const updated = await suggestRepo.requestChanges(id, reviewerId, reviewNotes, req.body.revision);
      if (!updated) {
        res.status(409).json({ status: 'error', message: 'This submission changed or is no longer pending. Refresh and review the latest version.' });
        return;
      }
      try {
        const notification = await createNotification({
          userId: suggestion.submitterId,
          title: 'Changes requested for herb suggestion',
          message: `An administrator requested changes to “${suggestion.localName}”: ${reviewNotes}`,
          type: 'SUGGESTION_UPDATE',
          link: '/suggest',
        });
        const { io } = await import('../server.js');
        io.to(suggestion.submitterId).emit('notification', notification);
      } catch (notificationError) {
        console.error('Failed to deliver change-request notification:', notificationError);
      }

      res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Changes requested.',
        data: { suggestion: updated },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject a suggestion.
   */
  public rejectSuggestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const reviewerId = authReq.user?.userId;
      const id = parseInt(req.params.id as string, 10);

      if (isNaN(id)) {
        res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid suggestion ID',
        });
        return;
      }

      if (!reviewerId) {
        res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Authentication required.',
        });
        return;
      }

      const suggestion = await suggestRepo.findSuggestionById(id);
      if (!suggestion) {
        res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Suggestion not found.',
        });
        return;
      }

      if (suggestion.status !== 'Pending') {
        res.status(409).json({
          status: 'error',
          code: 409,
          message: `This suggestion is already ${suggestion.status.toLowerCase()}.`,
        });
        return;
      }

      const updated = await suggestRepo.rejectSuggestion(id, reviewerId, req.body.revision);
      if (!updated) {
        res.status(409).json({ status: 'error', message: 'This submission changed or is no longer pending. Refresh and review the latest version.' });
        return;
      }

      // 2. Dispatch submitter notification
      try {
        const notif = await createNotification({
          userId: suggestion.submitterId,
          title: "Herb Suggestion Update",
          message: `Your submitted suggestion for "${suggestion.localName}" (${suggestion.scientificName}) was reviewed and not approved at this time.`,
          type: "SUGGESTION_UPDATE",
        });

        const { io } = await import("../server.js");
        io.to(suggestion.submitterId).emit("notification", notif);

        const submitter = await prisma.user.findUnique({ where: { id: suggestion.submitterId } });
        if (submitter?.email) {
          sendMail({
            to: submitter.email,
            subject: `${ENV.APP_NAME} - Herb Suggestion Update`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #d90429;">Herb Suggestion Status Update</h2>
                <p>Hello <strong>${submitter.name}</strong>,</p>
                <p>Your contribution for <strong>${suggestion.localName}</strong> (<em>${suggestion.scientificName}</em>) was reviewed by our administrative panel and was not approved for publication to the public library.</p>
                <p>Please ensure all traditional use information and botanical details adhere to DOH Philippine guidelines before resubmitting.</p>
              </div>
            `,
          }).catch((e) => console.error("Failed to send rejection email:", e));
        }
      } catch (notifErr) {
        console.error("Failed to deliver notification:", notifErr);
      }

      res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Herb suggestion rejected.',
        data: { suggestion: updated },
      });
    } catch (error) {
      next(error);
    }
  };
}
