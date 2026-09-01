import { PILLARS, type Pillar } from "../domain";
import { Chip } from "./Chip";

export function PillarPicker({ value, onChange, optional = true }: { value?: Pillar; onChange(value?: Pillar): void; optional?: boolean }) {
  return (
    <div className="pillar-picker" role="group" aria-label="Choose a Pillar">
      {PILLARS.map((pillar) => <Chip key={pillar.key} selected={value === pillar.key} onClick={() => onChange(value === pillar.key && optional ? undefined : pillar.key)}>{pillar.label}</Chip>)}
    </div>
  );
}
