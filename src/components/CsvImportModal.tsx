'use client';

import { useRef, useState } from 'react';
import { importStudentsFromCsvAction } from '@/app/actions';

// Maps CSV header variations to internal field names
const FIELD_MAP: Record<string, string> = {
    name: 'name',
    'full name': 'name',
    fullname: 'name',
    'student name': 'name',
    email: 'email',
    'email address': 'email',
    password: 'password',
    pass: 'password',
    belt: 'currentBeltId',
    beltid: 'currentBeltId',
    belt_id: 'currentBeltId',
    'belt id': 'currentBeltId',
    'current belt': 'currentBeltId',
    stripes: 'stripes',
    'start date': 'startDate',
    startdate: 'startDate',
    start_date: 'startDate',
    'contract start': 'contractStartDate',
    'contract start date': 'contractStartDate',
    contractstartdate: 'contractStartDate',
    'contract renewal': 'contractRenewal',
    contractrenewal: 'contractRenewal',
    renewal: 'contractRenewal',
    address: 'address',
    swat: 'isSwatTeam',
    'swat team': 'isSwatTeam',
    isswatteam: 'isSwatTeam',
    is_swat: 'isSwatTeam',
    notes: 'senseiNotes',
    'sensei notes': 'senseiNotes',
    senseinotes: 'senseiNotes',
    'next test': 'nextTestDate',
    'test date': 'nextTestDate',
    nextTestDate: 'nextTestDate',
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.trim().split(/\r?\n/);
    const parse = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (ch === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        result.push(cur.trim());
        return result;
    };
    const headers = parse(lines[0]);
    const rows = lines.slice(1).filter(l => l.trim()).map(parse);
    return { headers, rows };
}

function mapHeaders(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    headers.forEach(h => {
        const key = h.toLowerCase().trim();
        if (FIELD_MAP[key]) mapping[h] = FIELD_MAP[key];
    });
    return mapping;
}

function rowToStudent(headers: string[], row: string[], mapping: Record<string, string>) {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
        const field = mapping[h];
        if (!field) return;
        const val = row[i] ?? '';
        if (field === 'stripes') obj[field] = parseInt(val) || 0;
        else if (field === 'isSwatTeam') obj[field] = ['true', '1', 'yes'].includes(val.toLowerCase());
        else obj[field] = val;
    });
    return obj;
}

type Step = 'upload' | 'preview' | 'result';

interface ImportResult {
    imported: number;
    skipped: number;
    errors: string[];
}

interface Props {
    onClose: () => void;
    onImported: () => void;
}

export default function CsvImportModal({ onClose, onImported }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<Step>('upload');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [parseError, setParseError] = useState('');

    const handleFile = (file: File) => {
        setParseError('');
        if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
            setParseError('Please upload a .csv file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const { headers: h, rows: r } = parseCSV(text);
                if (h.length < 2) { setParseError('CSV appears to have no columns.'); return; }
                const m = mapHeaders(h);
                setHeaders(h);
                setRows(r);
                setMapping(m);
                setStep('preview');
            } catch {
                setParseError('Could not parse this file. Make sure it is a valid CSV.');
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const students = rows.map(r => rowToStudent(headers, r, mapping));
    const validCount = students.filter(s => s.name && s.email).length;
    const invalidCount = students.length - validCount;

    const handleImport = async () => {
        setIsImporting(true);
        try {
            const res = await importStudentsFromCsvAction(students as any);
            setResult(res);
            setStep('result');
            if (res.imported > 0) onImported();
        } finally {
            setIsImporting(false);
        }
    };

    const unmappedHeaders = headers.filter(h => !mapping[h]);
    const hasMappedName = Object.values(mapping).includes('name');
    const hasMappedEmail = Object.values(mapping).includes('email');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/[0.1] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">Import Students from CSV</h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {step === 'upload' && 'Upload a CSV file with student data'}
                            {step === 'preview' && `${rows.length} rows detected — review before importing`}
                            {step === 'result' && 'Import complete'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6">

                    {/* Step: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dragOver ? 'border-yellow-500 bg-yellow-500/5' : 'border-white/10 hover:border-white/30 hover:bg-white/[0.02]'}`}
                            >
                                <div className="text-4xl mb-3">📂</div>
                                <p className="text-white font-medium mb-1">Drop a CSV file here</p>
                                <p className="text-sm text-gray-500">or click to browse</p>
                                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                            </div>
                            {parseError && <p className="text-red-400 text-sm">{parseError}</p>}

                            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Expected columns</p>
                                <div className="flex flex-wrap gap-2">
                                    {['name', 'email', 'password', 'belt', 'stripes', 'start date', 'address', 'swat'].map(col => (
                                        <span key={col} className={`text-xs px-2 py-1 rounded font-mono ${['name', 'email'].includes(col) ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-white/5 text-gray-400 border border-white/5'}`}>
                                            {col}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-3">
                                    <span className="text-yellow-500">name</span> and <span className="text-yellow-500">email</span> are required. All other columns are optional.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-5">
                            {/* Column mapping status */}
                            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Column Mapping</p>
                                <div className="space-y-1.5">
                                    {headers.map(h => (
                                        <div key={h} className="flex items-center justify-between text-sm">
                                            <span className="font-mono text-gray-300">{h}</span>
                                            {mapping[h] ? (
                                                <span className="text-xs text-green-400 font-medium">→ {mapping[h]}</span>
                                            ) : (
                                                <span className="text-xs text-gray-600 italic">ignored</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {(!hasMappedName || !hasMappedEmail) && (
                                    <p className="text-red-400 text-xs mt-3 font-medium">
                                        ⚠ Could not detect {!hasMappedName ? 'name' : ''}{!hasMappedName && !hasMappedEmail ? ' or ' : ''}{!hasMappedEmail ? 'email' : ''} column. Rename your CSV headers and re-upload.
                                    </p>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="flex gap-3">
                                <div className="flex-1 bg-green-500/5 border border-green-500/10 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-400">{validCount}</div>
                                    <div className="text-xs text-gray-500 mt-1">Ready to import</div>
                                </div>
                                {invalidCount > 0 && (
                                    <div className="flex-1 bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-center">
                                        <div className="text-2xl font-bold text-red-400">{invalidCount}</div>
                                        <div className="text-xs text-gray-500 mt-1">Missing name/email</div>
                                    </div>
                                )}
                            </div>

                            {/* Preview table */}
                            <div className="overflow-hidden rounded-xl border border-white/5 bg-gray-800/50">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5">
                                            <tr>
                                                {headers.map(h => (
                                                    <th key={h} className="p-3 text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                                                        {h}
                                                        {mapping[h] && <span className="text-yellow-600 ml-1 normal-case font-normal">({mapping[h]})</span>}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {rows.slice(0, 10).map((row, i) => {
                                                const s = students[i];
                                                const isValid = s.name && s.email;
                                                return (
                                                    <tr key={i} className={`transition-colors ${isValid ? 'hover:bg-white/[0.02]' : 'bg-red-500/5'}`}>
                                                        {row.map((cell, j) => (
                                                            <td key={j} className="p-3 text-gray-300 whitespace-nowrap max-w-[180px] truncate">{cell}</td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {rows.length > 10 && (
                                    <div className="p-3 text-center text-xs text-gray-600 border-t border-white/5">
                                        Showing 10 of {rows.length} rows
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-500">
                                Students with an email already in the system will be skipped. Passwords will be hashed before storing.
                            </p>
                        </div>
                    )}

                    {/* Step: Result */}
                    {step === 'result' && result && (
                        <div className="space-y-5">
                            <div className="flex gap-3">
                                <div className="flex-1 bg-green-500/5 border border-green-500/10 rounded-xl p-6 text-center">
                                    <div className="text-4xl font-bold text-green-400">{result.imported}</div>
                                    <div className="text-sm text-gray-400 mt-1">Students imported</div>
                                </div>
                                <div className="flex-1 bg-white/[0.04] border border-white/5 rounded-xl p-6 text-center">
                                    <div className="text-4xl font-bold text-gray-400">{result.skipped}</div>
                                    <div className="text-sm text-gray-400 mt-1">Skipped (duplicate or invalid)</div>
                                </div>
                            </div>
                            {result.errors.length > 0 && (
                                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                                    <p className="text-xs font-bold uppercase text-red-400 mb-2">Errors</p>
                                    <ul className="space-y-1">
                                        {result.errors.map((e, i) => (
                                            <li key={i} className="text-xs text-red-300">{e}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-between items-center shrink-0">
                    {step === 'upload' && (
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                            Cancel
                        </button>
                    )}
                    {step === 'preview' && (
                        <>
                            <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                ← Back
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isImporting || validCount === 0 || !hasMappedName || !hasMappedEmail}
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold text-sm rounded-lg transition-all active:scale-95"
                            >
                                {isImporting ? 'Importing...' : `Import ${validCount} Student${validCount !== 1 ? 's' : ''}`}
                            </button>
                        </>
                    )}
                    {step === 'result' && (
                        <button onClick={onClose} className="ml-auto px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold text-sm rounded-lg transition-all active:scale-95">
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
