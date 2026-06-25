import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { CATEGORIES, MENU_ITEMS } from "../../graphql/queries";
import {
  CREATE_ITEM,
  UPDATE_ITEM,
  DELETE_ITEM,
  TOGGLE_ITEM,
  DELETE_MENU_ITEMS,
} from "../../graphql/mutations";
import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { inr } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";
import { DataTable, useClientTable, type Column } from "../../components/DataTable";
import MenuItemModal from "./MenuItemModal";
import { menuItemSchema, type MenuForm } from "../../form";
import { BLANK_FORM, type Cat, type Item } from "./types";

export default function Menu() {
  const { data: catData } = useQuery<{ categories: Cat[] }>(CATEGORIES);
  const { data, loading, refetch } = useQuery<{ menuItems: Item[] }>(MENU_ITEMS);
  const [createItem] = useMutation(CREATE_ITEM);
  const [updateItem] = useMutation(UPDATE_ITEM);
  const [deleteItem] = useMutation(DELETE_ITEM);
  const [deleteMany] = useMutation(DELETE_MENU_ITEMS);
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

  const columns = useMemo<Column<Item>[]>(() => [
    {
      key: "name", label: "Item", sortable: true,
      searchValue: (it) => `${it.name} ${it.description ?? ""}`, sortValue: (it) => it.name,
      render: (it) => (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={700}>{it.name}</Typography>
            {it.badge !== "NONE" ? (
              <Chip size="small" variant="outlined" color={it.badge === "NEW" ? "success" : "primary"} label={it.badge} />
            ) : null}
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: 360 }}>
            {it.description}
          </Typography>
        </>
      ),
    },
    {
      key: "category", label: "Category", sortable: true,
      searchValue: (it) => it.category?.name ?? "", sortValue: (it) => it.category?.name ?? "",
      render: (it) => <Typography variant="body2" color="text.secondary">{it.category?.name ?? "—"}</Typography>,
    },
    {
      key: "spiceLevel", label: "Spice", sortable: true, sortValue: (it) => it.spiceLevel,
      render: (it) => (it.spiceLevel > 0 ? "🌶️".repeat(it.spiceLevel) : <Typography variant="body2" color="text.secondary">mild</Typography>),
    },
    {
      key: "isAvailable", label: "Available", sortable: true, sortValue: (it) => (it.isAvailable ? 1 : 0),
      render: (it) => (
        <Chip
          size="small"
          clickable
          variant="outlined"
          color={it.isAvailable ? "success" : "error"}
          label={it.isAvailable ? "In stock" : "Out of stock"}
          onClick={() => toggleItem(it)}
        />
      ),
    },
    {
      key: "price", label: "Price", align: "right", sortable: true, sortValue: (it) => it.price,
      render: (it) => <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(it.price)}</Typography>,
    },
    {
      key: "profit", label: "Profit", align: "right", sortable: true,
      sortValue: (it) => it.price - (it.makingCost ?? 0),
      render: (it) => {
        const profit = it.price - (it.makingCost ?? 0);
        const margin = it.price > 0 ? Math.round((profit / it.price) * 100) : 0;
        return (
          <>
            <Typography fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }} color={profit >= 0 ? "success.main" : "error"}>{inr(profit)}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">{margin}% margin</Typography>
          </>
        );
      },
    },
  ], []);

  const { tableProps } = useClientTable(items, columns, { initialSortKey: "name", initialSortDir: "asc" });

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
      makingCost: it.makingCost ?? 0,
      image: it.image ?? "",
      categoryId: it.category?.id ?? "",
      spiceSelectable: it.spiceSelectable ?? true,
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
      makingCost: form.makingCost,
      image: form.image,
      categoryId: form.categoryId,
      spiceSelectable: form.spiceSelectable,
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
    const ok = await confirm({ title: "Delete item", message: `Delete “${it.name}”?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteItem({ variables: { id: it.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete items", message: `Delete ${ids.length} selected item(s)?`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await deleteMany({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  return (
    <Layout title="Menu">
      {cats.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>Create a category first before adding menu items.</Alert>
      )}

      <DataTable
        columns={columns}
        rowKey={(it) => it.id}
        loading={loading && !data}
        emptyLabel="No menu items yet."
        noun="item"
        searchPlaceholder="Search menu…"
        onBulkDelete={bulkDelete}
        renderActions={(it) => (
          <>
            <Button size="small" onClick={() => toggleItem(it)}>{it.isAvailable ? "Mark out" : "Mark in"}</Button>
            <Button size="small" onClick={() => openEdit(it)}>Edit</Button>
            <Button size="small" color="error" onClick={() => remove(it)}>Delete</Button>
          </>
        )}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew} disabled={cats.length === 0}>New item</Button>}
        {...tableProps}
      />

      {open && (
        <MenuItemModal
          editing={Boolean(editing)}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
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
