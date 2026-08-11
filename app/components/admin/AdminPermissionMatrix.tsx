"use client";

import { AdminActionButton } from "./AdminActionButton";
import { AdminMessage } from "./AdminBlocks";

export type PermissionMatrixModule = {
  key: string;
  name: string;
  sortOrder?: number | null;
  submodules?: Array<{
    key: string;
    name: string;
    sortOrder?: number | null;
  }>;
};

export type PermissionMatrixPermission = {
  id?: string;
  key: string;
  name: string;
  moduleKey?: string | null;
  submoduleKey?: string | null;
};

export type PermissionMatrixRow = {
  key: string;
  moduleName: string;
  moduleKey: string;
  submoduleName: string;
  submoduleKey: string;
  permissions: PermissionMatrixPermission[];
};

type AdminPermissionMatrixProps = {
  rows: PermissionMatrixRow[];
  selectedPermissionKeys: string[];
  onToggle?: (permissionKey: string) => void;
  disabledPermissionKeys?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  minHeightClassName?: string;
};

export function buildPermissionMatrixRows(
  modules: PermissionMatrixModule[],
  permissions: PermissionMatrixPermission[],
) {
  const modulesByKey = new Map(
    modules.map((moduleItem) => [moduleItem.key, moduleItem]),
  );
  const rowsByKey = new Map<string, PermissionMatrixRow>();

  for (const permission of permissions) {
    const moduleKey = permission.moduleKey ?? "system";
    const moduleItem = modulesByKey.get(moduleKey);
    const submoduleKey = permission.submoduleKey ?? "general";
    const submoduleItem = moduleItem?.submodules?.find(
      (submodule) => submodule.key === submoduleKey,
    );
    const rowKey = `${moduleKey}:${submoduleKey}`;

    if (!rowsByKey.has(rowKey)) {
      rowsByKey.set(rowKey, {
        key: rowKey,
        moduleName: moduleItem?.name ?? moduleKey,
        moduleKey,
        submoduleName: submoduleItem?.name ?? submoduleKey,
        submoduleKey,
        permissions: [],
      });
    }

    rowsByKey.get(rowKey)?.permissions.push(permission);
  }

  return Array.from(rowsByKey.values())
    .map((row) => ({
      ...row,
      permissions: row.permissions.sort((first, second) =>
        first.name.localeCompare(second.name),
      ),
    }))
    .sort((first, second) => {
      const firstModule = modulesByKey.get(first.moduleKey);
      const secondModule = modulesByKey.get(second.moduleKey);
      const moduleOrder =
        (firstModule?.sortOrder ?? 999) - (secondModule?.sortOrder ?? 999);

      if (moduleOrder !== 0) {
        return moduleOrder;
      }

      const firstSubmodule = firstModule?.submodules?.find(
        (submodule) => submodule.key === first.submoduleKey,
      );
      const secondSubmodule = secondModule?.submodules?.find(
        (submodule) => submodule.key === second.submoduleKey,
      );
      const submoduleOrder =
        (firstSubmodule?.sortOrder ?? 999) -
        (secondSubmodule?.sortOrder ?? 999);

      return submoduleOrder !== 0
        ? submoduleOrder
        : first.submoduleName.localeCompare(second.submoduleName);
    });
}

export function AdminPermissionMatrix({
  rows,
  selectedPermissionKeys,
  onToggle,
  disabledPermissionKeys = [],
  emptyTitle = "Sin permisos disponibles",
  emptyDescription = "No hay permisos delegables para este contexto.",
  className = "",
  minHeightClassName = "min-h-80",
}: AdminPermissionMatrixProps) {
  if (rows.length === 0) {
    return <AdminMessage title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div
      className={`mt-4 overflow-hidden rounded-[22px] border border-[#e4ead5] bg-white ${className}`}
    >
      <div className="grid grid-cols-[0.75fr_0.85fr_1.8fr] border-b border-[#e8eedb] bg-[#f8fbef] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7c8c51]">
        <span>Modulo</span>
        <span>Submodulo</span>
        <span>Permisos</span>
      </div>

      <div className={`${minHeightClassName} overflow-y-auto`}>
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[0.75fr_0.85fr_1.8fr] gap-3 border-b border-[#edf1e4] px-4 py-3 last:border-b-0"
          >
            <div>
              <p className="text-sm font-semibold text-[#1b2111]">
                {row.moduleName}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#8b9572]">
                {row.moduleKey}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#344222]">
                {row.submoduleName}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#8b9572]">
                {row.submoduleKey}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {row.permissions.map((permission) => {
                const active = selectedPermissionKeys.includes(permission.key);
                const disabled =
                  !onToggle || disabledPermissionKeys.includes(permission.key);

                return (
                  <AdminActionButton
                    key={permission.id ?? permission.key}
                    type="button"
                    tone="secondary"
                    active={active}
                    disabled={disabled}
                    size="sm"
                    onClick={() => onToggle?.(permission.key)}
                  >
                    {permission.name}
                  </AdminActionButton>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
