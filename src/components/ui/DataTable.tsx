import React from "react";
import { cn } from "../../lib/utils";
import { Search } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  actionButton?: React.ReactNode;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  searchQuery,
  actionButton,
  onRowClick,
  isLoading,
}: DataTableProps<T>) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col">
      {/* Table Toolbar */}
      {(onSearch || actionButton) && (
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
          {onSearch && (
            <div className="relative w-full sm:w-96">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary/50 border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}
          {actionButton}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={cn("px-6 py-4", col.headerClassName)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  Loading data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  No results found.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors group",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className={cn("px-6 py-4", col.className)}>
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? (item[col.accessorKey] as React.ReactNode)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
