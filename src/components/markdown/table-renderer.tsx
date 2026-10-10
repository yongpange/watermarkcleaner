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
    <div className="table-wrapper">
      <table>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: TableRendererProps) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: TableRendererProps) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: TableRendererProps) {
  return (
    <tr>
      {children}
    </tr>
  );
}

export function TableHead({ children }: TableRendererProps) {
  return <th>{children}</th>;
}

export function TableCell({ children }: TableRendererProps) {
  return <td>{children}</td>;
}

// 解析原始Markdown表格的函数
function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim().replace(/\*\*/g, ''));
}

export function parseMarkdownTable(markdown: string): TableData | null {
  const lines = markdown
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'));

  if (lines.length < 2) return null;

  const headers = splitRow(lines[0]);
  const body = /^[\s|:-]+$/.test(lines[1]) ? lines.slice(2) : lines.slice(1);
  const rows = body.map(splitRow).filter((row) => row.some(Boolean));

  if (!headers.length || !rows.length) return null;
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