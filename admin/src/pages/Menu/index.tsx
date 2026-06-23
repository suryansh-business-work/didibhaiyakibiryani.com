import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { CATEGORIES, MENU_ITEMS } from "../../graphql/queries";
import {
  CREATE_ITEM,
  UPDATE_ITEM,
  DELETE_ITEM,
  TOGGLE_ITEM,
} from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";
import MenuTable from "./MenuTable";
import MenuItemModal from "./MenuItemModal";
import { menuItemSchema, type MenuForm } from "../../form";
import { BLANK_FORM, type Cat, type Item } from "./types";

export default function Menu() {
  const { data: catData } = useQuery<{ categories: Cat[] }>(CATEGORIES);
  const { data, loading, refetch } = useQuery<{ menuItems: Item[] }>(MENU_ITEMS);
  const [createItem] = useMutation(CREATE_ITEM);
  const [updateItem] = useMutation(UPDATE_ITEM);
  const [deleteItem] = useMutation(DELETE_ITEM);
  const [toggle] = useMutation(TOGGLE_ITEM);

  const confirm = useConfirm();
  const notify = useAlert();

  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MenuForm>({ resolver: zodResolver(menuItemSchema), defaultValues: { ...BLANK_FORM } });

  const cats = catData?.categories ?? [];
  const items = data?.menuItems ?? [];

  function openNew() {
    setEditing(null);
    reset({ ...BLANK_FORM, categoryId: cats[0]?.id ?? "" });
    setOpen(true);
  }

  function openEdit(it: Item) {
    setEditing(it);
    reset({
      name: it.name,
      description: it.description ?? "",
      price: it.price,
      image: it.image ?? "",
      categoryId: it.category?.id ?? "",
      spiceLevel: it.spiceLevel,
      serves: it.serves,
      badge: it.badge as MenuForm["badge"],
      tags: it.tags.join(", "),
      isAvailable: it.isAvailable,
    });
    setOpen(true);
  }

  async function onSave(form: MenuForm) {
    const input = {
      name: form.name.trim(),
      description: form.description,
      price: form.price,
      image: form.image,
      categoryId: form.categoryId,
      spiceLevel: form.spiceLevel,
      serves: form.serves,
      badge: form.badge,
      tags: (form.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      isAvailable: form.isAvailable,
    };
    try {
      if (editing) {
        await updateItem({ variables: { id: editing.id, input } });
      } else {
        await createItem({ variables: { input } });
      }
      setOpen(false);
      await refetch();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save." });
    }
  }

  async function toggleItem(it: Item) {
    await toggle({ variables: { id: it.id } });
    await refetch();
  }

  async function remove(it: Item) {
    const ok = await confirm({
      title: "Delete item",
      message: `Delete “${it.name}”?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) {
      return;
    }
    try {
      await deleteItem({ variables: { id: it.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({
        title: "Could not delete",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  return (
    <Layout title="Menu">
      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={openNew} disabled={cats.length === 0}>
          <IPlus size={16} /> New item
        </button>
      </div>
      {cats.length === 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <span className="muted">Create a category first before adding menu items.</span>
        </div>
      )}

      <div className="card">
        <MenuTable
          items={items}
          loading={loading && !data}
          onEdit={openEdit}
          onToggle={toggleItem}
          onDelete={remove}
        />
      </div>

      {open && (
        <MenuItemModal
          editing={Boolean(editing)}
          control={control}
          errors={errors}
          cats={cats}
          imageUrl={watch("image") ?? ""}
          onImageUploaded={(url) => setValue("image", url)}
          isSubmitting={isSubmitting}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit(onSave)}
        />
      )}
    </Layout>
  );
}
