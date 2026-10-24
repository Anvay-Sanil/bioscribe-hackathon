import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    Zap,
    LayoutDashboard,
    FileText,
    Microscope,
    Atom,
    Dna,
    LogOut,
    Moon,
    Sun,
    Laptop
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function CommandPalette() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 overflow-hidden shadow-2xl border-0 bg-transparent max-w-[640px]">
                <div className="bg-white/95 backdrop-blur-xl rounded-xl border border-slate-200 overflow-hidden">
                    <Command className="w-full">
                        <div className="flex items-center border-b border-slate-100 px-4" cmdk-input-wrapper="">
                            <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
                            <Command.Input
                                placeholder="Type a command or search..."
                                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                            <Command.Empty className="py-6 text-center text-sm text-slate-500">
                                No results found.
                            </Command.Empty>

                            <Command.Group heading="Suggestions" className="px-2 py-1.5 text-xs font-medium text-slate-500">
                                <Command.Item className="flex items-center px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors">
                                    <Zap className="mr-2 h-4 w-4" />
                                    <span>New Analysis</span>
                                </Command.Item>
                                <Command.Item className="flex items-center px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    <span>Go to Dashboard</span>
                                </Command.Item>
                                <Command.Item className="flex items-center px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors">
                                    <Microscope className="mr-2 h-4 w-4" />
                                    <span>Search Protein Database</span>
                                </Command.Item>
                            </Command.Group>

                            <Command.Group heading="Tools" className="px-2 py-1.5 text-xs font-medium text-slate-500 mt-2">
                                <Command.Item className="flex items-center px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors">
                                    <Dna className="mr-2 h-4 w-4" />
                                    <span>Protein Folding (AlphaFold 3)</span>
                                </Command.Item>
                                <Command.Item className="flex items-center px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors">
                                    <Atom className="mr-2 h-4 w-4" />
                                    <span>Ligand Docking (DiffDock)</span>
                                </Command.Item>
                                <Command.Item className="flex items-center px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors">
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Generate Report</span>
                                </Command.Item>
                            </Command.Group>

                            <Command.Group heading="Settings" className="px-2 py-1.5 text-xs font-medium text-slate-500 mt-2">
                                <Command.Item className="flex items-center px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Command.Item>
                                <Command.Item className="flex items-center px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Command.Item>
                                <Command.Item className="flex items-center px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </Command.Item>
                            </Command.Group>
                        </Command.List>

                        <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
                            <div className="flex gap-2">
                                <span>Select</span>
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    <span className="text-xs">↵</span>
                                </kbd>
                            </div>
                            <div className="flex gap-2">
                                <span>Navigate</span>
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    <span className="text-xs">↑</span>
                                </kbd>
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                    <span className="text-xs">↓</span>
                                </kbd>
                            </div>
                        </div>
                    </Command>
                </div>
            </DialogContent>
        </Dialog>
    );
}
