import React from 'react';
import Button from './Button';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: number }> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
  emptyMessage?: string;
}

const DataTable = <T extends { id: number }>({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage = "Nenhum item encontrado.",
}: DataTableProps<T>) => {
  const renderCell = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }
    if (column.key === 'actions') {
      return (
        <div className="flex items-center justify-end gap-2">
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(item)} className="p-2 h-auto" aria-label={`Editar ${item.id}`}>
              <Edit size={16} />
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(item.id)} className="p-2 h-auto" aria-label={`Excluir ${item.id}`}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      );
    }
    const value = (item as any)[column.key];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return '';
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={cn('px-6 py-3', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={`${item.id}-${col.key}`} className={cn('px-6 py-4', col.className)}>
                      {renderCell(item, col)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.length > 0 ? (
          data.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="space-y-3">
                {columns.map((col) => {
                  if (col.key === 'actions') return null;
                  return (
                    <div key={`${item.id}-${col.key}`}>
                      <p className="text-xs font-medium text-gray-500 uppercase">{col.header}</p>
                      <div>{renderCell(item, col)}</div>
                    </div>
                  );
                })}
              </div>
              {columns.find(c => c.key === 'actions') && (
                <div className="mt-4 pt-3 border-t">
                  {renderCell(item, columns.find(c => c.key === 'actions')!)}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">{emptyMessage}</div>
        )}
      </div>
    </>
  );
};

export default DataTable;