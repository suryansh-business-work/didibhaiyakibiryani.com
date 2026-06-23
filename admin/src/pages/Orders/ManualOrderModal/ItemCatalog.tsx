import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { inr } from "../../../components/ui";
import type { CategoryOption, MenuOption } from "./types";

interface Props {
  items: MenuOption[];
  categories: CategoryOption[];
  onAdd: (item: MenuOption) => void;
}

/** Searchable, category-filtered grid of dishes; tapping a card adds it. */
export function ItemCatalog({ items, categories, onAdd }: Readonly<Props>) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("ALL");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchCat = cat === "ALL" || it.category?.id === cat;
      const matchText = !q || it.name.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [items, search, cat]);

  return (
    <Stack spacing={2} sx={{ height: "100%" }}>
      <TextField
        placeholder="Search dishes…"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />
      <Stack direction="row" spacing={1} sx={{ overflowX: "auto", flexShrink: 0, pb: 0.5 }}>
        <Chip label="All" color={cat === "ALL" ? "primary" : "default"} onClick={() => setCat("ALL")} />
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} color={cat === c.id ? "primary" : "default"} onClick={() => setCat(c.id)} />
        ))}
      </Stack>
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 1.5,
          alignContent: "start",
        }}
      >
        {filtered.map((it) => (
          <Card key={it.id} variant="outlined">
            <CardActionArea onClick={() => onAdd(it)}>
              <Box
                sx={{
                  height: 92,
                  bgcolor: "action.hover",
                  backgroundImage: it.image ? `url(${it.image})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <CardContent sx={{ p: 1.25 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{it.name}</Typography>
                <Typography variant="body2" color="primary" fontWeight={800}>{inr(it.price)}</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
        {filtered.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 2 }}>No dishes match your search.</Typography>
        ) : null}
      </Box>
    </Stack>
  );
}
