import { describe, expect, it } from 'vitest';
import { DR_AI_SYSTEM_PROMPT } from '../src/config/drAiSystemPrompt.js';

describe('Dr. Ai language behavior', () => {
  it('requires matching the language used in the latest question', () => {
    expect(DR_AI_SYSTEM_PROMPT).toContain("same language or Philippine language variety used in the user's latest question");
    expect(DR_AI_SYSTEM_PROMPT).toContain('Filipino/Tagalog');
    expect(DR_AI_SYSTEM_PROMPT).toContain('Bisaya/Cebuano');
    expect(DR_AI_SYSTEM_PROMPT).toContain('Ilocano');
    expect(DR_AI_SYSTEM_PROMPT).toContain('Hiligaynon/Ilonggo');
    expect(DR_AI_SYSTEM_PROMPT).toContain('Waray');
  });

  it('covers mixed-language and unclear-language questions', () => {
    expect(DR_AI_SYSTEM_PROMPT).toContain('If the user mixes languages');
    expect(DR_AI_SYSTEM_PROMPT).toContain('ask one short clarifying question rather than guessing');
  });

  it('expands sparse records only with source-grounded clarification', () => {
    expect(DR_AI_SYSTEM_PROMPT).toContain('brief **In plain language** explanation');
    expect(DR_AI_SYSTEM_PROMPT).toContain('do not merely repeat the source or invent extra medical facts');
    expect(DR_AI_SYSTEM_PROMPT).toContain('say exactly what is missing rather than generating a second, speculative answer');
  });
});
