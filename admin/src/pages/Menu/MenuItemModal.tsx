import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Modal } from "../../components/ui";
import ImageUpload from "../../components/ImageUpload";
import { RHFField, type MenuForm } from "../../form";
import { BADGE_OPTIONS, type Cat } from "./types";

interface MenuItemModalProps {
  editing: boolean;
  control: Control<MenuForm>;
  errors: FieldErrors<MenuForm>;
  cats: Cat[];
  imageUrl: string;
  onImageUploaded: (url: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function MenuItemModal({
  editing,
  control,
  errors,
  cats,
  imageUrl,
  onImageUploaded,
  isSubmitting,
  onClose,
  onSubmit,
}: Readonly<MenuItemModalProps>) {
  return (
    <Modal
      title={editing ? "Edit item" : "New item"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</button>
        </>
      }
    >
      <RHFField control={control} name="name" label="Name" error={errors.name?.message} />
      <RHFField control={control} name="description" label="Description" multiline error={errors.description?.message} />
      <ImageUpload label="Item photo" folder="/menu" currentUrl={imageUrl} onUploaded={onImageUploaded} />
      <div className="field-row">
        <RHFField control={control} name="price" label="Price (₹)" type="number" error={errors.price?.message} />
        <div className="field">
          <label>Category</label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <select value={field.value} onChange={field.onChange} style={errors.categoryId ? { borderColor: "var(--red)" } : undefined}>
                <option value="">Select…</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          />
          {errors.categoryId ? <div className="field-error">{errors.categoryId.message}</div> : null}
        </div>
      </div>
      <div className="field-row">
        <RHFField control={control} name="spiceLevel" label="Spice level (0–3)" type="number" error={errors.spiceLevel?.message} />
        <RHFField control={control} name="serves" label="Serves" error={errors.serves?.message} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Badge</label>
          <Controller
            control={control}
            name="badge"
            render={({ field }) => (
              <select value={field.value} onChange={field.onChange}>
                {BADGE_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            )}
          />
        </div>
        <RHFField control={control} name="tags" label="Tags (comma-separated)" placeholder="bestseller, paneer" error={errors.tags?.message} />
      </div>
      <Controller
        control={control}
        name="isAvailable"
        render={({ field }) => (
          <label className="check">
            <input type="checkbox" checked={!field.value} onChange={(e) => field.onChange(!e.target.checked)} /> Out of stock (hides “Add” in apps and blocks ordering)
          </label>
        )}
      />
      {errors.root && <div className="error-text">{errors.root.message}</div>}
    </Modal>
  );
}
