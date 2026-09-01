import { FIVE_CS, type FiveCKey, type FiveCsRatings } from "../domain";

export function FiveCsEditor({ value, onChange }: { value: FiveCsRatings; onChange(value: FiveCsRatings): void }) {
  const update = (key: FiveCKey, next: number) => onChange({ ...value, [key]: next });
  return (
    <div className="five-cs">
      {FIVE_CS.map((item) => (
        <label className="five-cs__row" key={item.key}>
          <span><strong>{item.label}</strong><small>{item.meaning}</small></span>
          <span className="five-cs__control">
            <input type="range" min="1" max="10" value={value[item.key]} onChange={(event) => update(item.key, Number(event.target.value))} aria-label={`${item.label} rating`} />
            <output>{value[item.key]}</output>
          </span>
        </label>
      ))}
    </div>
  );
}
