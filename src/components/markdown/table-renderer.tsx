import React from 'react';

interface TableData {
  headers: string[];
  rows: string[][];
}

interface TableRendererProps {
  children: React.ReactNode;
}

export function Table({ children }: TableRendererProps) {
  return (
    <div className="table-container my-8 overflow-x-auto">
      <table className="w-full border-collapse bg-card rounded-lg shadow-sm border border-border/50">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: TableRendererProps) {
  return <thead className="bg-muted/50">{children}</thead>;
}

export function TableBody({ children }: TableRendererProps) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: TableRendererProps) {
  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors last:border-b-0">
      {children}
    </tr>
  );
}

export function TableHead({ children }: TableRendererProps) {
  return (
    <th className="px-6 py-4 text-left font-semibold text-foreground/90">
      {children}
    </th>
  );
}

export function TableCell({ children }: TableRendererProps) {
  return (
    <td className="px-6 py-4 text-foreground">
      {children}
    </td>
  );
}

// 解析原始Markdown表格的函数
export function parseMarkdownTable(markdown: string): TableData | null {
  // 查找表格的正则表达式
  const tableRegex = /\n?\n?\|(.+?)\|\n\|[-:\s]+\|\n((?:\|.+?\|\n?)+)/;
  const match = markdown.match(tableRegex);

  if (!match) return null;

  // 解析表头
  const headerLine = match[1].trim();
  const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);

  // 解析行
  const rowLines = match[2].trim().split('\n');
  const rows = rowLines
    .filter(line => line.includes('|'))
    .map(line => {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      return cells;
    });

  return { headers, rows };
}

// 完整的表格渲染组件
export function MarkdownTable({ data }: { data: TableData }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {data.headers.map((header, index) => (
            <TableHead key={index}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <TableCell key={cellIndex}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}