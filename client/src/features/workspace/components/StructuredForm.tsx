import type { ParsedFileData } from '@shared/types/workspace';

interface StructuredFormProps {
  filename: 'SOUL.md' | 'IDENTITY.md' | 'AGENTS.md';
  data: ParsedFileData;
  onChange: (data: ParsedFileData) => void;
}

function isValidSingleEmoji(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return true;
  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u;
  return emojiRegex.test(trimmed);
}

export function StructuredForm({ filename, data, onChange }: StructuredFormProps) {
  if (filename === 'SOUL.md') {
    return <SoulForm data={data} onChange={onChange} />;
  }
  if (filename === 'IDENTITY.md') {
    return <IdentityForm data={data} onChange={onChange} />;
  }
  return <AgentsForm data={data} onChange={onChange} />;
}

function SoulForm({ data, onChange }: { data: ParsedFileData; onChange: (d: ParsedFileData) => void }) {
  const soul = data.soul ?? { language: '', rules: [] };

  const updateSoul = (updates: Partial<NonNullable<ParsedFileData['soul']>>) => {
    onChange({ ...data, soul: { ...soul, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Language
          <input
            className="mt-1 block w-full border rounded px-3 py-2"
            value={soul.language}
            onChange={(e) => updateSoul({ language: e.target.value })}
          />
        </label>
      </div>

      <div>
        <span className="block text-sm font-medium mb-1">Rules</span>
        {soul.rules.map((rule, i) => (
          <input
            key={i}
            className="block w-full border rounded px-3 py-2 mb-1"
            value={rule}
            onChange={(e) => {
              const newRules = [...soul.rules];
              newRules[i] = e.target.value;
              updateSoul({ rules: newRules });
            }}
          />
        ))}
      </div>

      {soul.teamMembers && soul.teamMembers.length > 0 && (
        <div>
          <span className="block text-sm font-medium mb-1">Team Members</span>
          {soul.teamMembers.map((member, i) => (
            <div key={i} className="flex gap-2 mb-1">
              <input
                className="flex-1 border rounded px-3 py-2"
                value={member.name}
                onChange={(e) => {
                  const newMembers = [...(soul.teamMembers ?? [])];
                  newMembers[i] = { ...newMembers[i], name: e.target.value };
                  updateSoul({ teamMembers: newMembers });
                }}
              />
              <input
                className="flex-1 border rounded px-3 py-2"
                value={member.mention}
                onChange={(e) => {
                  const newMembers = [...(soul.teamMembers ?? [])];
                  newMembers[i] = { ...newMembers[i], mention: e.target.value };
                  updateSoul({ teamMembers: newMembers });
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IdentityForm({ data, onChange }: { data: ParsedFileData; onChange: (d: ParsedFileData) => void }) {
  const identity = data.identity ?? { name: '', role: '', emoji: '', vibe: '' };
  const emojiInvalid = identity.emoji !== '' && !isValidSingleEmoji(identity.emoji);

  const updateIdentity = (updates: Partial<NonNullable<ParsedFileData['identity']>>) => {
    onChange({ ...data, identity: { ...identity, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Name
          <input
            className="mt-1 block w-full border rounded px-3 py-2"
            value={identity.name}
            onChange={(e) => updateIdentity({ name: e.target.value })}
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Role
          <input
            className="mt-1 block w-full border rounded px-3 py-2"
            value={identity.role}
            onChange={(e) => updateIdentity({ role: e.target.value })}
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Emoji
          <input
            className={`mt-1 block w-full border rounded px-3 py-2 ${emojiInvalid ? 'border-red-500' : ''}`}
            value={identity.emoji}
            onChange={(e) => updateIdentity({ emoji: e.target.value })}
          />
        </label>
        {emojiInvalid && (
          <span className="text-red-500 text-sm">Emoji must be a single emoji character</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Vibe
          <input
            className="mt-1 block w-full border rounded px-3 py-2"
            value={identity.vibe}
            onChange={(e) => updateIdentity({ vibe: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function AgentsForm({ data, onChange }: { data: ParsedFileData; onChange: (d: ParsedFileData) => void }) {
  const agents = data.agents ?? {};

  const updateAgents = (updates: Partial<NonNullable<ParsedFileData['agents']>>) => {
    onChange({ ...data, agents: { ...agents, ...updates } });
  };

  return (
    <div className="space-y-4">
      {agents.sessionStartChecklist && agents.sessionStartChecklist.length > 0 && (
        <div>
          <span className="block text-sm font-medium mb-1">Session Start Checklist</span>
          {agents.sessionStartChecklist.map((item, i) => (
            <input
              key={i}
              className="block w-full border rounded px-3 py-2 mb-1"
              value={item}
              onChange={(e) => {
                const newList = [...(agents.sessionStartChecklist ?? [])];
                newList[i] = e.target.value;
                updateAgents({ sessionStartChecklist: newList });
              }}
            />
          ))}
        </div>
      )}

      {agents.safetyRules && agents.safetyRules.length > 0 && (
        <div>
          <span className="block text-sm font-medium mb-1">Safety Rules</span>
          {agents.safetyRules.map((rule, i) => (
            <input
              key={i}
              className="block w-full border rounded px-3 py-2 mb-1"
              value={rule}
              onChange={(e) => {
                const newRules = [...(agents.safetyRules ?? [])];
                newRules[i] = e.target.value;
                updateAgents({ safetyRules: newRules });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
