"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AdminActionButton,
  CheckIcon,
  EyeIcon,
  PencilIcon,
  SparkIcon,
  TrashIcon,
  UserPlusIcon,
} from "./AdminActionButton";
import { HoverTooltip } from "../ui/HoverTooltip";
import { useToast } from "../../context/toast-context";

type AdminTableAction<T> = {
  label: string;
  permission?: string;
  tone?: "soft" | "accent" | "dark" | "warn";
  disabled?: boolean;
  icon?: ReactNode;
  active?: (row: T) => boolean;
  visible?: (row: T) => boolean;
  onClick?: (row: T) => void;
};

type AdminTableColumn<T> = {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  render: (row: T) => ReactNode;
};

export type AdminTableFetchInput = {
  page: number;
  limit: number;
  search: string;
};

export type AdminTableFetchResult<T> = {
  data: T[];
  total: number;
};

type AdminDataTableProps<T> = {
  rows?: T[];
  rowKey: (row: T) => string;
  columns: AdminTableColumn<T>[];
  actions?: AdminTableAction<T>[];
  permissionKeys?: string[];
  fetchData?: (input: AdminTableFetchInput) => Promise<AdminTableFetchResult<T>>;
  onDataLoaded?: (result: AdminTableFetchResult<T>) => void;
  reloadKey?: string | number;
  initialLimit?: number;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  emptyTitle: string;
  emptyDescription: string;
};

function getActionIcon(label: string) {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes("detalle") || normalizedLabel.includes("ver")) {
    return <EyeIcon />;
  }

  if (normalizedLabel.includes("editar")) {
    return <PencilIcon />;
  }

  if (
    normalizedLabel.includes("eliminar") ||
    normalizedLabel.includes("borrar") ||
    normalizedLabel.includes("suspender")
  ) {
    return <TrashIcon />;
  }

  if (
    normalizedLabel.includes("aprobar") ||
    normalizedLabel.includes("activar") ||
    normalizedLabel.includes("reactivar")
  ) {
    return <CheckIcon />;
  }

  if (
    normalizedLabel.includes("asignar") ||
    normalizedLabel.includes("vincular")
  ) {
    return <UserPlusIcon />;
  }

  return <SparkIcon />;
}

function normalizeTableSearch(value: string) {
  return value.trim().toLowerCase();
}

export function createLocalAdminTableFetch<T>({
  getRows,
  filterRow,
}: {
  getRows: () => Promise<T[]> | T[];
  filterRow?: (row: T, search: string) => boolean;
}) {
  return async ({
    page,
    limit,
    search,
  }: AdminTableFetchInput): Promise<AdminTableFetchResult<T>> => {
    const rows = await getRows();
    const normalizedSearch = normalizeTableSearch(search);
    const filteredRows = normalizedSearch
      ? rows.filter((row) =>
          filterRow
            ? filterRow(row, normalizedSearch)
            : normalizeTableSearch(JSON.stringify(row)).includes(normalizedSearch),
        )
      : rows;
    const start = (page - 1) * limit;

    return {
      data: filteredRows.slice(start, start + limit),
      total: filteredRows.length,
    };
  };
}

export function AdminDataTable<T>({
  rows,
  rowKey,
  columns,
  actions = [],
  permissionKeys = [],
  fetchData,
  onDataLoaded,
  reloadKey,
  initialLimit,
  searchValue,
  searchPlaceholder = "Buscar...",
  onSearchChange,
  page,
  limit,
  total,
  onPageChange,
  emptyTitle,
  emptyDescription,
}: AdminDataTableProps<T>) {
  const toast = useToast();
  const fetchDataRef = useRef(fetchData);
  const onDataLoadedRef = useRef(onDataLoaded);
  const [internalRows, setInternalRows] = useState<T[]>(rows ?? []);
  const [internalTotal, setInternalTotal] = useState(total ?? rows?.length ?? 0);
  const [internalPage, setInternalPage] = useState(page ?? 1);
  const [internalLimit] = useState(initialLimit ?? limit ?? 10);
  const [internalSearch, setInternalSearch] = useState(searchValue ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchValue ?? "");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded;
  }, [onDataLoaded]);

  useEffect(() => {
    if (fetchDataRef.current) {
      return;
    }

    setInternalRows(rows ?? []);
    setInternalTotal(total ?? rows?.length ?? 0);
  }, [rows, total]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(internalSearch);
      setInternalPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [internalSearch]);

  useEffect(() => {
    if (!fetchDataRef.current) {
      return;
    }

    let cancelled = false;

    async function run() {
      setIsFetching(true);
      setFetchError(null);

      try {
        const result = await fetchDataRef.current!({
          page: internalPage,
          limit: internalLimit,
          search: debouncedSearch,
        });

        if (cancelled) {
          return;
        }

        setInternalRows(result.data);
        setInternalTotal(result.total);
        onDataLoadedRef.current?.(result);
      } catch (error) {
        if (!cancelled) {
          setFetchError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar la tabla.",
          );
          toast.showError(error, "No se pudo cargar la tabla");
          setInternalRows([]);
          setInternalTotal(0);
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, internalLimit, internalPage, reloadKey, toast]);

  const tableRows = fetchData ? internalRows : rows ?? [];
  const tableTotal = fetchData ? internalTotal : total ?? tableRows.length;
  const currentPage = fetchData ? internalPage : page;
  const currentLimit = fetchData ? internalLimit : limit;
  const changePage = fetchData ? setInternalPage : onPageChange;
  const currentSearch = fetchData ? internalSearch : searchValue;
  const changeSearch = fetchData ? setInternalSearch : onSearchChange;
  const visibleActions = actions.filter(
    (action) => !action.permission || permissionKeys.includes(action.permission),
  );
  const hasPagination =
    currentPage !== undefined &&
    currentLimit !== undefined &&
    tableTotal !== undefined &&
    Boolean(changePage);
  const totalPages = hasPagination
    ? Math.max(1, Math.ceil(tableTotal / currentLimit))
    : 1;
  const firstItem =
    hasPagination && tableTotal > 0 ? (currentPage - 1) * currentLimit + 1 : 0;
  const lastItem = hasPagination
    ? Math.min(currentPage * currentLimit, tableTotal)
    : tableRows.length;

  const controls =
    changeSearch || hasPagination ? (
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {changeSearch ? (
          <input
            className="w-full rounded-[20px] border border-[#e2e8d0] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a9cf24] md:max-w-sm"
            placeholder={searchPlaceholder}
            value={currentSearch ?? ""}
            onChange={(event) => changeSearch(event.target.value)}
          />
        ) : (
          <div />
        )}
        {hasPagination ? (
          <div className="flex items-center justify-end gap-2 text-sm text-[#61704c]">
            <span>
              {firstItem}-{lastItem} de {tableTotal}
            </span>
            <AdminActionButton
              tone="secondary"
              size="sm"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => changePage?.(currentPage - 1)}
            >
              Anterior
            </AdminActionButton>
            <AdminActionButton
              tone="secondary"
              size="sm"
              disabled={currentPage >= totalPages || isFetching}
              onClick={() => changePage?.(currentPage + 1)}
            >
              Siguiente
            </AdminActionButton>
          </div>
        ) : null}
      </div>
    ) : null;

  if (fetchError) {
    return (
      <>
        {controls}
        <div className="rounded-[26px] border border-[#f0d6d1] bg-[#fff7f5] px-5 py-6">
          <p className="font-semibold text-[#5b2018]">No se pudo cargar la tabla</p>
          <p className="mt-2 text-sm leading-7 text-[#7b443d]">{fetchError}</p>
        </div>
      </>
    );
  }

  if (tableRows.length === 0) {
    return (
      <>
        {controls}
        <div className="rounded-[26px] border border-[#edf1e4] bg-[#fbfcf8] px-5 py-6">
          <p className="font-semibold text-[#1a210f]">
            {isFetching ? "Cargando..." : emptyTitle}
          </p>
          <p className="mt-2 text-sm leading-7 text-[#5d664d]">
            {isFetching ? "Estamos consultando los datos de la tabla." : emptyDescription}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {controls}
      <div className="overflow-x-auto rounded-[26px] border border-[#edf1e4] bg-white">
        <table className="min-w-full text-left text-sm">
        <thead className="bg-[#fbfcf8] text-[#75815d]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] ${
                  column.align === "center"
                    ? "text-center"
                    : column.align === "right"
                      ? "text-right"
                      : "text-left"
                }`}
              >
                {column.label}
              </th>
            ))}
            {visibleActions.length > 0 ? (
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.24em] text-[#75815d]">
                Acciones
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1e4]">
          {tableRows.map((row) => {
            const rowActions = visibleActions.filter(
              (action) => !action.visible || action.visible(row),
            );

            return (
              <tr
                key={rowKey(row)}
                className="bg-white transition-colors hover:bg-[#fcfef9]"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-5 py-4 align-top ${
                      column.align === "center"
                        ? "text-center"
                        : column.align === "right"
                          ? "text-right"
                          : "text-left"
                    }`}
                  >
                    {column.render(row)}
                  </td>
                ))}
                {visibleActions.length > 0 ? (
                  <td className="px-5 py-4">
                    {rowActions.length > 0 ? (
                      <div className="flex flex-wrap justify-end gap-2 rounded-full border border-[#eef2e4] bg-[#fbfcf8] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                        {rowActions.map((action) => (
                          <div key={action.label} className="group relative">
                            <HoverTooltip label={action.label}>
                              <AdminActionButton
                                aria-label={action.label}
                                disabled={action.disabled || !action.onClick}
                                onClick={() => action.onClick?.(row)}
                                icon={action.icon ?? getActionIcon(action.label)}
                                active={action.active?.(row) ?? false}
                                size="icon"
                                tone={
                                  action.tone === "accent"
                                    ? "accent"
                                    : action.tone === "dark"
                                      ? "primary"
                                      : action.tone === "warn"
                                        ? "danger"
                                        : "secondary"
                                }
                              />
                            </HoverTooltip>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </>
  );
}
