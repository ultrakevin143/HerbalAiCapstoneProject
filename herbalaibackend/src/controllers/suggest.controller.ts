import type { Request, Response, NextFunction } from 'express';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import * as suggestRepo from '../repositories/suggest.repository.js';
import { invalidateHerbCache } from '../repositories/herb.repository.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { generateEmbedding } from '../services/ai/core/gemini-service.js';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../repositories/audit.repository.js';
import { createNotification } from '../repositories/notification.repository.js';
import { sendMail } from '../lib/mailer.js';
import { ENV } from '../config/env.js';

export class SuggestController {
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
          status: 'Pending',
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
        res.status(400).json({
          status: 'error',
          code: 400,
          message: `This suggestion is already ${suggestion.status.toLowerCase()}.`,
        });
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
      
      let vectorStr: string | null = null;
      try {
        const embedding = await generateEmbedding(textToEmbed);
        vectorStr = `[${embedding.join(',')}]`;
      } catch (err) {
        console.error("Embedding generation failed, saving without embedding:", err);
      }

      // Approve in repository
      const herb = await suggestRepo.approveSuggestion(id, reviewerId, vectorStr);
      invalidateHerbCache();

      // 1. Log administrative action
      await createAuditLog({
        adminId: reviewerId,
        action: "APPROVE_SUGGESTION",
        targetType: "SuggestedHerb",
        targetId: String(id),
        details: {
          localName: suggestion.localName,
          scientificName: suggestion.scientificName,
          herbId: herb?.id,
          submitterId: suggestion.submitterId,
        },
      }).catch((err) => console.error("Failed to write audit log:", err));

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
                <p>Great news! Your contribution for <strong>${suggestion.localName}</strong> (<em>${suggestion.scientificName}</em>) has been verified and approved by our team.</p>
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
        res.status(400).json({
          status: 'error',
          code: 400,
          message: `This suggestion is already ${suggestion.status.toLowerCase()}.`,
        });
        return;
      }

      const updated = await suggestRepo.rejectSuggestion(id, reviewerId);

      // 1. Log administrative action
      await createAuditLog({
        adminId: reviewerId,
        action: "REJECT_SUGGESTION",
        targetType: "SuggestedHerb",
        targetId: String(id),
        details: {
          localName: suggestion.localName,
          scientificName: suggestion.scientificName,
          submitterId: suggestion.submitterId,
        },
      }).catch((err) => console.error("Failed to write audit log:", err));

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
