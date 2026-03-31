import * as XLSX from 'xlsx';

const SHEET_NAME_MAX = 31;

const sanitizeName = (value = '') =>
    String(value)
        .replace(/[\\/*?:[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const sanitizeSheetName = (value, fallback) => {
    const cleaned = sanitizeName(value) || fallback;
    return cleaned.slice(0, SHEET_NAME_MAX);
};

const getControlValue = (control) => {
    if (!control) return '';

    if (control.tagName === 'SELECT') {
        return control.value || '';
    }

    if (control.type === 'checkbox') {
        return control.checked ? 'Yes' : 'No';
    }

    if (control.type === 'radio') {
        return control.checked ? (control.value || 'Selected') : '';
    }

    return control.value || '';
};

const getCellValue = (cell) => {
    const controls = Array.from(cell.querySelectorAll('input, select, textarea'));
    if (controls.length > 0) {
        const values = controls
            .map(getControlValue)
            .map((value) => String(value).trim())
            .filter(Boolean);
        if (values.length > 0) return values.join(' | ');
    }

    return (cell.textContent || '').replace(/\s+/g, ' ').trim();
};

const extractTableData = (table) => {
    const rows = [];
    const headerCells = Array.from(table.querySelectorAll('thead th'));

    if (headerCells.length > 0) {
        rows.push(headerCells.map((th) => getCellValue(th)));
    }

    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
    const sourceRows = bodyRows.length > 0 ? bodyRows : Array.from(table.querySelectorAll('tr'));

    sourceRows.forEach((tr, index) => {
        if (headerCells.length > 0 && bodyRows.length === 0 && index === 0) return;
        const cells = Array.from(tr.querySelectorAll('th, td'));
        if (cells.length === 0) return;
        rows.push(cells.map((cell) => getCellValue(cell)));
    });

    return rows.filter((row) => row.some((col) => String(col || '').trim() !== ''));
};

const extractFormData = (root) => {
    const controls = Array.from(root.querySelectorAll('input, select, textarea'))
        .filter((control) => control.type !== 'hidden')
        .filter((control) => control.offsetParent !== null);

    const rows = [['Field', 'Value']];
    controls.forEach((control) => {
        const group = control.closest('.mb-3, .mb-2, .form-group, td, .col, .stage-grid');
        const labelEl = group?.querySelector('label, .stage-label') || control.closest('label');
        const fallback = control.name || control.id || control.placeholder || control.getAttribute('aria-label');
        const label = (labelEl?.textContent || fallback || '').replace(/\s+/g, ' ').trim();
        const value = getControlValue(control);
        if (!label || value === '') return;
        rows.push([label, value]);
    });

    return rows.length > 1 ? rows : [];
};

export const exportPageToExcel = ({ pageName = 'Export', rootElement }) => {
    const root = rootElement || document.body;
    const workbook = XLSX.utils.book_new();
    const safeBase = sanitizeName(pageName) || 'Export';
    const timestamp = new Date().toISOString().slice(0, 10);

    const tables = Array.from(root.querySelectorAll('table'))
        .filter((table) => table.offsetParent !== null);

    if (tables.length > 0) {
        tables.forEach((table, index) => {
            const data = extractTableData(table);
            if (data.length === 0) return;
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(
                workbook,
                ws,
                sanitizeSheetName(`${safeBase} ${index + 1}`, `Sheet${index + 1}`)
            );
        });
    }

    if (workbook.SheetNames.length === 0) {
        const formData = extractFormData(root);
        if (formData.length > 0) {
            const ws = XLSX.utils.aoa_to_sheet(formData);
            XLSX.utils.book_append_sheet(workbook, ws, sanitizeSheetName(`${safeBase} Form`, 'FormData'));
        }
    }

    if (workbook.SheetNames.length === 0) {
        const ws = XLSX.utils.aoa_to_sheet([['No tabular data found on this page.']]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Export');
    }

    XLSX.writeFile(workbook, `${safeBase}_${timestamp}.xlsx`);
};
