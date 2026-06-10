import { useState } from "react";
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
import { BLANK_FORM, type Cat, type Item, type MenuForm } from "./types";

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
  const [form, setForm] = useState<MenuForm>({ ...BLANK_FORM });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const cats = catData?.categories ?? [];
  const items = data?.menuItems ?? [];

  function openNew() {
    setEditing(null);
    setForm({ ...BLANK_FORM, categoryId: cats[0]?.id ?? "" });
    setErr("");
    setOpen(true);
  }

  function openEdit(it: Item) {
    setEditing(it);
    setForm({
      name: it.name,
      description: it.description ?? "",
      price: it.price,
      categoryId: it.category?.id ?? "",
      spiceLevel: it.spiceLevel,
      serves: it.serves,
      badge: it.badge,
      tags: it.tags.join(", "),
      isAvailable: it.isAvailable,
    });
    setErr("");
    setOpen(true);
  }

  async function save() {
    setErr("");
    if (!form.name.trim() || !form.categoryId) {
      setErr("Name and category are required.");
      return;
    }
    setBusy(true);
    const input = {
      name: form.name.trim(),
      description: form.description,
      price: Number(form.price),
      categoryId: form.categoryId,
      spiceLevel: Number(form.spiceLevel),
      serves: form.serves,
      badge: form.badge,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
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
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
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
          form={form}
          cats={cats}
          busy={busy}
          error={err}
          onChange={setForm}
          onClose={() => setOpen(false)}
          onSave={save}
        />
      )}
    </Layout>
  );
}
