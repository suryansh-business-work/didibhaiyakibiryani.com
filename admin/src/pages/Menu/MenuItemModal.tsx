import { Modal } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";
import { BADGE_OPTIONS, type Cat, type MenuForm } from "./types";

interface MenuItemModalProps {
  editing: boolean;
  form: MenuForm;
  cats: Cat[];
  busy: boolean;
  error: string;
  onChange: (form: MenuForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function MenuItemModal({
  editing,
  form,
  cats,
  busy,
  error,
  onChange,
  onClose,
  onSave,
}: Readonly<MenuItemModalProps>) {
  const set = (patch: Partial<MenuForm>) => onChange({ ...form, ...patch });

  return (
    <Modal
      title={editing ? "Edit item" : "New item"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-gold" onClick={onSave} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="field">
        <label>Name</label>
        <input value={form.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>
      <ImageUpload
        label="Item photo"
        folder="/menu"
        currentUrl={form.image}
        onUploaded={(url) => set({ image: url })}
      />
      <div className="field-row">
        <div className="field">
          <label>Price (₹)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => set({ price: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => set({ categoryId: e.target.value })}
          >
            <option value="">Select…</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Spice level (0–3)</label>
          <input
            type="number"
            min={0}
            max={3}
            value={form.spiceLevel}
            onChange={(e) => set({ spiceLevel: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Serves</label>
          <input value={form.serves} onChange={(e) => set({ serves: e.target.value })} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Badge</label>
          <select value={form.badge} onChange={(e) => set({ badge: e.target.value })}>
            {BADGE_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={(e) => set({ tags: e.target.value })}
            placeholder="bestseller, paneer"
          />
        </div>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={!form.isAvailable}
          onChange={(e) => set({ isAvailable: !e.target.checked })}
        />
        Out of stock (hides “Add” in apps and blocks ordering)
      </label>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}
