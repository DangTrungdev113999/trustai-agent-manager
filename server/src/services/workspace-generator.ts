import type { ParsedFileData, WorkspaceFilename } from '@shared/types/workspace.js';

export function generateMd(data: ParsedFileData, filename: WorkspaceFilename): string {
  const parts: string[] = [];

  if (filename === 'SOUL.md' && data.soul) {
    if (data.soul.language) {
      parts.push(data.soul.language);
    }

    if (data.soul.rules && data.soul.rules.length > 0) {
      const rulesList = data.soul.rules
        .map((r, i) => `${i + 1}. ${r}`)
        .join('\n');
      parts.push(`## Rules\n${rulesList}`);
    }

    if (data.soul.teamMembers && data.soul.teamMembers.length > 0) {
      const header = '| Member | Mention |\n|--------|---------|';
      const rows = data.soul.teamMembers
        .map((m) => `| ${m.name} | \`${m.mention}\` |`)
        .join('\n');
      parts.push(`## Team\n${header}\n${rows}`);
    }

    if (data.soul.initProjectCommand) {
      parts.push(`## Init Project\n\`\`\`bash\n${data.soul.initProjectCommand}\n\`\`\``);
    }

    if (data.soul.planThreadBehavior) {
      parts.push(`## PLAN thread\n${data.soul.planThreadBehavior}`);
    }

    if (data.soul.milestoneWorkflow) {
      parts.push(`## Milestone Workflow\n${data.soul.milestoneWorkflow}`);
    }
  }

  if (filename === 'IDENTITY.md' && data.identity) {
    const lines = [
      `- Name: ${data.identity.name}`,
      `- Role: ${data.identity.role}`,
      `- Emoji: ${data.identity.emoji}`,
      `- Vibe: ${data.identity.vibe}`,
    ];
    parts.push(`## Identity\n${lines.join('\n')}`);
  }

  if (filename === 'AGENTS.md' && data.agents) {
    if (data.agents.sessionStartChecklist && data.agents.sessionStartChecklist.length > 0) {
      const items = data.agents.sessionStartChecklist
        .map((item) => `- [ ] ${item}`)
        .join('\n');
      parts.push(`## Session Start Checklist\n${items}`);
    }

    if (data.agents.safetyRules && data.agents.safetyRules.length > 0) {
      const items = data.agents.safetyRules
        .map((item) => `- ${item}`)
        .join('\n');
      parts.push(`## Safety Rules\n${items}`);
    }

    if (data.agents.firstRunInstructions) {
      parts.push(`## First Run Instructions\n${data.agents.firstRunInstructions}`);
    }

    if (data.agents.memoryPolicy) {
      parts.push(`## Memory Policy\n${data.agents.memoryPolicy}`);
    }

    if (data.agents.externalVsInternal) {
      parts.push(`## External vs Internal\n${data.agents.externalVsInternal}`);
    }

    if (data.agents.groupChatGuidelines) {
      parts.push(`## Group Chat Guidelines\n${data.agents.groupChatGuidelines}`);
    }

    if (data.agents.toolsNotes) {
      parts.push(`## Tools Notes\n${data.agents.toolsNotes}`);
    }
  }

  // Append freeform sections
  for (const section of data.freeformSections) {
    if (section.content) {
      parts.push(`## ${section.heading}\n${section.content}`);
    } else {
      parts.push(`## ${section.heading}`);
    }
  }

  return parts.join('\n\n');
}
