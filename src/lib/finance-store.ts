import { useCallback, useEffect, useState } from "react";

export type AccountType = "card" | "cash" | "deposit";
export type DebtType = "i_owe" | "owed_to_me";
export type CurrencySymbol = "₼" | "$" | "€" | "₽";
export type AppTheme = "cosmos" | "neon" | "midnight";

export type Account = {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  color: string; // e.g. "blue" | "pink" | "emerald" | "violet" | "amber"
};

export type Credit = {
  id: string;
  name: string;
  amount: number;
  rate?: number;
  monthlyPayment?: number;
  dueDate?: string;
  note?: string;
};

export type Debt = {
  id: string;
  name: string;
  type: DebtType; // "i_owe" (Я должен) or "owed_to_me" (Мне должны)
  amount: number;
  dueDate?: string;
  note?: string;
};

export type Transaction = {
  id: string;
  type: "expense" | "income";
  category: string;
  amount: number; // positive
  accountId?: string;
  date: string; // ISO string
  note?: string;
};

export type Category = {
  id: string;
  name: string;
  type: "expense" | "income";
  color?: string;
};

export type Settings = {
  currency: CurrencySymbol;
  theme: AppTheme;
  reminders: boolean;
  limitAlerts: boolean;
  soundEffects: boolean;
};

const KEYS = {
  accounts: "gd.v2.accounts",
  credits: "gd.v2.credits",
  debts: "gd.v2.debts",
  transactions: "gd.v2.transactions",
  categories: "gd.v2.categories",
  settings: "gd.v2.settings",
  auth: "gd.v2.auth",
} as const;

const DEFAULT_SETTINGS: Settings = {
  currency: "₼",
  theme: "cosmos",
  reminders: true,
  limitAlerts: true,
  soundEffects: false,
};

type AuthState = {
  isAuthenticated: boolean;
  pin: string;
};

const DEFAULT_AUTH: AuthState = {
  isAuthenticated: false,
  pin: "2580",
};

const SEED_ACCOUNTS: Account[] = [];

const SEED_CREDITS: Credit[] = [];

const SEED_DEBTS: Debt[] = [];

const SEED_TRANSACTIONS: Transaction[] = [];

const SEED_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Продукты", type: "expense", color: "#3B82F6" },
  { id: "cat-2", name: "Транспорт", type: "expense", color: "#8B5CF6" },
  { id: "cat-3", name: "Кафе и рестораны", type: "expense", color: "#EC4899" },
  { id: "cat-4", name: "Развлечения", type: "expense", color: "#F59E0B" },
  { id: "cat-5", name: "Зарплата", type: "income", color: "#10B981" },
  { id: "cat-6", name: "Фриланс", type: "income", color: "#06B6D4" },
];

function read<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function readObj<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore storage quota errors */
  }
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function useFinance() {
  const [hydrated, setHydrated] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [auth, setAuth] = useState<AuthState>(DEFAULT_AUTH);

  // Hydrate after mount to avoid SSR mismatch.
  useEffect(() => {
    setAccounts(read<Account>(KEYS.accounts, SEED_ACCOUNTS));
    setCredits(read<Credit>(KEYS.credits, SEED_CREDITS));
    setDebts(read<Debt>(KEYS.debts, SEED_DEBTS));
    setTransactions(read<Transaction>(KEYS.transactions, SEED_TRANSACTIONS));
    setCategories(read<Category>(KEYS.categories, SEED_CATEGORIES));
    setSettings(readObj<Settings>(KEYS.settings, DEFAULT_SETTINGS));
    setAuth(readObj<AuthState>(KEYS.auth, DEFAULT_AUTH));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    write(KEYS.accounts, accounts);
    write(KEYS.credits, credits);
    write(KEYS.debts, debts);
    write(KEYS.transactions, transactions);
    write(KEYS.categories, categories);
    write(KEYS.settings, settings);
    write(KEYS.auth, auth);
  }, [hydrated, accounts, credits, debts, transactions, categories, settings, auth]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const updateAuth = useCallback((newAuth: Partial<AuthState>) => {
    setAuth((prev) => ({ ...prev, ...newAuth }));
  }, []);

  const addAccount = useCallback((a: Omit<Account, "id">) => {
    const acc: Account = { ...a, id: uid() };
    setAccounts((prev) => [...prev, acc]);
  }, []);

  const editAccount = useCallback((id: string, updated: Omit<Account, "id">) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...updated, id } : a)));
  }, []);

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, "id" | "date"> & { date?: string }) => {
    const tx: Transaction = { ...t, id: uid(), date: t.date ?? new Date().toISOString() };
    setTransactions((prev) => [tx, ...prev]);
    if (tx.accountId) {
      const delta = tx.type === "income" ? tx.amount : -tx.amount;
      setAccounts((prev) =>
        prev.map((a) => (a.id === tx.accountId ? { ...a, balance: a.balance + delta } : a)),
      );
    }
  }, []);

  const addCredit = useCallback((c: Omit<Credit, "id">) => {
    setCredits((prev) => [...prev, { ...c, id: uid() }]);
  }, []);

  const editCredit = useCallback((id: string, updated: Omit<Credit, "id">) => {
    setCredits((prev) => prev.map((c) => (c.id === id ? { ...updated, id } : c)));
  }, []);

  const removeCredit = useCallback((id: string) => {
    setCredits((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const payCredit = useCallback(
    (creditId: string, accountId: string, amount: number) => {
      addTransaction({
        type: "expense",
        category: "Погашение кредита",
        amount,
        accountId,
        date: new Date().toISOString(),
      });
      setCredits((prev) =>
        prev.map((c) => {
          if (c.id === creditId && c.dueDate) {
            const d = new Date(c.dueDate);
            d.setMonth(d.getMonth() + 1);
            return { ...c, dueDate: d.toISOString().slice(0, 10) };
          }
          return c;
        }),
      );
    },
    [addTransaction],
  );

  const addDebt = useCallback((d: Omit<Debt, "id">) => {
    setDebts((prev) => [...prev, { ...d, id: uid() }]);
  }, []);

  const editDebt = useCallback((id: string, updated: Omit<Debt, "id">) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...updated, id } : d)));
  }, []);

  const removeDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addCategory = useCallback((c: Omit<Category, "id">) => {
    setCategories((prev) => [...prev, { ...c, id: uid() }]);
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const resetData = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
    setAccounts(SEED_ACCOUNTS);
    setCredits(SEED_CREDITS);
    setDebts(SEED_DEBTS);
    setTransactions(SEED_TRANSACTIONS);
    setCategories(SEED_CATEGORIES);
    setSettings(DEFAULT_SETTINGS);
    setAuth(DEFAULT_AUTH);
  }, []);

  // Aggregates
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const totalCredits = credits.reduce((s, c) => s + Number(c.amount || 0), 0);
  // Net debt calculation: debts where I owe add to total obligations, debts where someone owes me are assets
  const iOweDebtsTotal = debts
    .filter((d) => d.type === "i_owe")
    .reduce((s, d) => s + Number(d.amount || 0), 0);
  const owedToMeDebtsTotal = debts
    .filter((d) => d.type === "owed_to_me")
    .reduce((s, d) => s + Number(d.amount || 0), 0);
  const totalDebts = debts.reduce((s, d) => s + Number(d.amount || 0), 0);

  // Net formula: (All Accounts + Owed to me) - (Credits + I owe)
  const netAvailable = totalBalance + owedToMeDebtsTotal - totalCredits - iOweDebtsTotal;

  const now = new Date();
  const inCurrentMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const monthTransactions = transactions.filter((t) => inCurrentMonth(t.date));
  const monthlyExpenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthlyIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // Дневная кумулятивная кривая расходов текущего месяца
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthlyChartData: number[] = monthTransactions.length
    ? Array.from({ length: daysInMonth }, (_, i) =>
        monthTransactions
          .filter((t) => t.type === "expense" && new Date(t.date).getDate() === i + 1)
          .reduce((s, t) => s + Number(t.amount || 0), 0),
      )
    : [];

  const daysUntil = (dateStr?: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (Number.isNaN(target.getTime())) return null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    return Math.round((t.getTime() - today.getTime()) / 86400000);
  };

  const exportToCSV = useCallback(() => {
    if (typeof window === "undefined") return;
    const rows: string[][] = [
      ["--- ОТЧЕТ G-DIGITAL FINANCE ---"],
      ["Дата экспорта", new Date().toLocaleString("ru-RU")],
      ["Валюта", settings.currency],
      ["Общий баланс счетов", totalBalance.toString()],
      ["Сумма кредитов", totalCredits.toString()],
      ["Сумма долгов", totalDebts.toString()],
      ["Чистый остаток", netAvailable.toString()],
      [""],
      ["--- СЧЕТА ---"],
      ["ID", "Название", "Баланс", "Тип"],
      ...accounts.map((a) => [a.id, a.name, a.balance.toString(), a.type]),
      [""],
      ["--- ТРАНЗАКЦИИ ---"],
      ["ID", "Тип", "Категория", "Сумма", "Счет ID", "Дата"],
      ...transactions.map((t) => [
        t.id,
        t.type === "income" ? "Доход" : "Расход",
        t.category,
        t.amount.toString(),
        t.accountId || "-",
        new Date(t.date).toLocaleDateString("ru-RU"),
      ]),
    ];

    const csvContent =
      "\uFEFF" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `g-digital-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [
    settings.currency,
    totalBalance,
    totalCredits,
    totalDebts,
    netAvailable,
    accounts,
    transactions,
  ]);

  return {
    hydrated,
    accounts,
    credits,
    debts,
    transactions,
    categories,
    settings,
    auth,
    updateSettings,
    updateAuth,
    addAccount,
    editAccount,
    removeAccount,
    addCredit,
    editCredit,
    removeCredit,
    payCredit,
    addDebt,
    editDebt,
    removeDebt,
    addTransaction,
    removeTransaction,
    addCategory,
    removeCategory,
    resetData,
    exportToCSV,
    totalBalance,
    totalCredits,
    totalDebts,
    iOweDebtsTotal,
    owedToMeDebtsTotal,
    netAvailable,
    monthlyExpenses,
    monthlyIncome,
    monthlyChartData,
    daysUntil,
  };
}

export const fmt = (n: number, currency: CurrencySymbol = "₼") => {
  const isNegative = n < 0;
  const absVal = Math.abs(n).toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (currency === "$") return `${isNegative ? "−$" : "$"}${absVal}`;
  if (currency === "€") return `${isNegative ? "−" : ""}${absVal} €`;
  if (currency === "₽") return `${isNegative ? "−" : ""}${absVal} ₽`;
  return `${isNegative ? "−" : ""}${absVal} ₼`;
};
