import { Chip } from "./Chip";
import { Input } from "./Form";

export function ExamplePicker({ examples, value, onChange, placeholder = "Write my own" }: { examples: string[]; value: string; onChange(value: string, source: "example" | "own"): void; placeholder?: string }) {
  const selectedExample = examples.includes(value);
  return (
    <div className="example-picker">
      <div className="chip-list">
        {examples.map((example) => <Chip key={example} selected={value === example} onClick={() => onChange(example, "example")}>{example}</Chip>)}
      </div>
      <div className="own-answer">
        <span>or</span>
        <Input value={selectedExample ? "" : value} onChange={(event) => onChange(event.target.value, "own")} placeholder={placeholder} maxLength={90} />
      </div>
    </div>
  );
}
