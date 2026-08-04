import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  BookOpen,
  CreditCard,
  TrendingDown,
  TrendingUp,
  History as HistoryIcon,
  Menu as MenuIcon,
  Wallet,
  Plus,
  Inbox,
  Edit2,
  Trash2,
  Download,
  Tag,
  PieChart,
  User,
  Coins,
  Building2,
  X,
  Check,
  Bell,
  ShieldAlert,
  Volume2,
  RefreshCw,
  CheckCircle2,
  Lock,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFinance,
  fmt,
  type Account,
  type AccountType,
  type Credit,
  type Debt,
  type DebtType,
  type Transaction,
  type CurrencySymbol,
  type AppTheme,
} from "@/lib/finance-store";
import {
  NeonModal,
  NeonField,
  neonInputClass,
  neonSubmitClass,
} from "@/components/gdigital/NeonModal";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Счета — G-Digital" },
      {
        name: "description",
        content: "Управление счетами, кредитами, долгами и операциями в G-Digital.",
      },
    ],
  }),
  component: AccountsPage,
});

type ActiveTab = "accounts" | "expenses" | "income" | "history";
type ModalKind =
  | null
  | "settings"
  | "rules"
  | "alerts"
  | "account_add"
  | "account_edit"
  | "credit_add"
  | "credit_edit"
  | "credit_pay"
  | "debt_add"
  | "debt_edit"
  | "transaction"
  | "quick_fab"
  | "menu_drawer";

export function AccountsPage() {
  const f = useFinance();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>("accounts");
  const [modal, setModal] = useState<ModalKind>(null);

  // Selected item for edit
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [payingCredit, setPayingCredit] = useState<Credit | null>(null);

  // Quick transaction prefill type
  const [quickTxType, setQuickTxType] = useState<"expense" | "income">("expense");

  const close = () => {
    setModal(null);
    setEditingAccount(null);
    setEditingCredit(null);
    setEditingDebt(null);
    setPayingCredit(null);
  };

  const currency = f.settings.currency;

  // Alerts logic
  const urgentCredits = f.credits.filter((c) => {
    const d = f.daysUntil(c.dueDate);
    return d !== null && d <= 3;
  });
  const urgentDebts = f.debts.filter((d) => {
    const ds = f.daysUntil(d.dueDate);
    return ds !== null && ds <= 3 && d.type === "i_owe";
  });
  const totalAlerts = urgentCredits.length + urgentDebts.length;
  const topAlert = urgentCredits[0] || urgentDebts[0];

  const upcomingCredits = f.credits.filter((c) => {
    const d = f.daysUntil(c.dueDate);
    return d !== null && d <= 7;
  });
  const upcomingDebts = f.debts.filter((d) => {
    const ds = f.daysUntil(d.dueDate);
    return ds !== null && ds <= 7 && d.type === "i_owe";
  });
  const totalUpcomingPayments =
    upcomingCredits.reduce((s, c) => s + (c.monthlyPayment || c.amount), 0) +
    upcomingDebts.reduce((s, d) => s + d.amount, 0);

  const isInsufficientFunds = f.totalBalance < totalUpcomingPayments;

  return (
    <main className="gd-cosmos relative min-h-screen overflow-hidden font-sans text-white">
      <div className="gd-stars" aria-hidden />
      <div className="relative z-10 mx-auto max-w-[440px] px-4 pb-28 pt-5">
        {/* Top Header */}
        <Header
          onOpenSettings={() => setModal("settings")}
          onOpenRules={() => setModal("rules")}
          onOpenAlerts={() => setModal("alerts")}
          alertsCount={totalAlerts}
        />

        {isInsufficientFunds && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <ShieldAlert size={20} className="shrink-0 text-red-400" />
            <p className="text-[11px] font-medium text-red-200">
              ⚠️ Недостаточно средств на счетах для покрытия обязательных платежей в ближайшие 7
              дней.
            </p>
          </div>
        )}

        {topAlert && totalAlerts > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Bell size={20} className="shrink-0 text-amber-400" />
            <p className="text-xs font-medium text-amber-200">
              ⚠️ Внимание: Скоро платеж по {topAlert.name}!
            </p>
          </div>
        )}

        {/* Tab Content Rendering */}
        {activeTab === "accounts" && (
          <>
            {/* Summary Top Card */}
            <Summary
              balance={f.totalBalance}
              credits={f.totalCredits}
              debts={f.totalDebts}
              currency={currency}
            />

            {/* Current Balance & Accounts */}
            <BalanceBlock
              accounts={f.accounts}
              total={f.totalBalance}
              currency={currency}
              onAdd={() => setModal("account_add")}
              onEdit={(acc) => {
                setEditingAccount(acc);
                setModal("account_edit");
              }}
              onDelete={(id) => f.removeAccount(id)}
            />

            {/* Net Available Panel */}
            <NetPanel
              net={f.netAvailable}
              balance={f.totalBalance}
              credits={f.totalCredits}
              debts={f.totalDebts}
              currency={currency}
            />

            {/* Credits & Debts Block */}
            <div className="mt-5 grid grid-cols-2 gap-3.5">
              <CreditsBlock
                credits={f.credits}
                total={f.totalCredits}
                currency={currency}
                daysUntil={f.daysUntil}
                onAdd={() => setModal("credit_add")}
                onEdit={(c) => {
                  setEditingCredit(c);
                  setModal("credit_edit");
                }}
                onDelete={(id) => f.removeCredit(id)}
                onPay={(c) => {
                  setPayingCredit(c);
                  setModal("credit_pay");
                }}
              />
              <DebtsBlock
                debts={f.debts}
                total={f.totalDebts}
                currency={currency}
                daysUntil={f.daysUntil}
                onAdd={() => setModal("debt_add")}
                onEdit={(d) => {
                  setEditingDebt(d);
                  setModal("debt_edit");
                }}
                onDelete={(id) => f.removeDebt(id)}
              />
            </div>

            {/* Monthly Expense Curve */}
            <ExpenseChart data={f.monthlyChartData} total={f.monthlyExpenses} currency={currency} />

            {/* Recent Operations */}
            <RecentOps
              transactions={f.transactions}
              accounts={f.accounts}
              currency={currency}
              onAdd={() => {
                setQuickTxType("expense");
                setModal("transaction");
              }}
              onDelete={(id) => f.removeTransaction(id)}
            />
          </>
        )}

        {activeTab === "expenses" && (
          <TransactionsTabView
            title="Учет расходов"
            type="expense"
            transactions={f.transactions.filter((t) => t.type === "expense")}
            accounts={f.accounts}
            total={f.monthlyExpenses}
            currency={currency}
            onAdd={() => {
              setQuickTxType("expense");
              setModal("transaction");
            }}
            onDelete={(id) => f.removeTransaction(id)}
          />
        )}

        {activeTab === "income" && (
          <TransactionsTabView
            title="Учет доходов"
            type="income"
            transactions={f.transactions.filter((t) => t.type === "income")}
            accounts={f.accounts}
            total={f.monthlyIncome}
            currency={currency}
            onAdd={() => {
              setQuickTxType("income");
              setModal("transaction");
            }}
            onDelete={(id) => f.removeTransaction(id)}
          />
        )}

        {activeTab === "history" && (
          <HistoryTabView
            transactions={f.transactions}
            accounts={f.accounts}
            currency={currency}
            onAdd={() => setModal("transaction")}
            onDelete={(id) => f.removeTransaction(id)}
          />
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setModal("quick_fab")}
        aria-label="Быстрый выбор действия"
        className="neon-violet gd-press fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/90 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus size={26} className="text-white" />
      </button>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenMenu={() => setModal("menu_drawer")}
      />

      {/* Modals */}
      <SettingsModal
        open={modal === "settings"}
        onClose={close}
        settings={f.settings}
        onUpdate={f.updateSettings}
        onResetData={f.resetData}
        auth={f.auth}
        onUpdateAuth={f.updateAuth}
        onLogout={() => {
          f.updateAuth({ isAuthenticated: false });
          navigate({ to: "/" });
        }}
      />

      <RulesModal open={modal === "rules"} onClose={close} />

      <AccountFormModal
        open={modal === "account_add"}
        title="Новый счет"
        onClose={close}
        onSubmit={(acc) => f.addAccount(acc)}
      />

      {editingAccount && (
        <AccountFormModal
          open={modal === "account_edit"}
          title="Редактировать счет"
          initialData={editingAccount}
          onClose={close}
          onSubmit={(acc) => f.editAccount(editingAccount.id, acc)}
        />
      )}

      <CreditFormModal
        open={modal === "credit_add"}
        title="Новый кредит"
        onClose={close}
        onSubmit={(c) => f.addCredit(c)}
      />

      {editingCredit && (
        <CreditFormModal
          open={modal === "credit_edit"}
          title="Редактировать кредит"
          initialData={editingCredit}
          onClose={close}
          onSubmit={(c) => f.editCredit(editingCredit.id, c)}
        />
      )}

      <DebtFormModal
        open={modal === "debt_add"}
        title="Новый долг"
        onClose={close}
        onSubmit={(d) => f.addDebt(d)}
      />

      {editingDebt && (
        <DebtFormModal
          open={modal === "debt_edit"}
          title="Редактировать долг"
          initialData={editingDebt}
          onClose={close}
          onSubmit={(d) => f.editDebt(editingDebt.id, d)}
        />
      )}

      {payingCredit && (
        <CreditPayModal
          open={modal === "credit_pay"}
          credit={payingCredit}
          accounts={f.accounts}
          onClose={close}
          onPay={(accountId, amount) => {
            f.payCredit(payingCredit.id, accountId, amount);
            close();
          }}
        />
      )}

      <AlertsModal
        open={modal === "alerts"}
        onClose={close}
        urgentCredits={urgentCredits}
        urgentDebts={urgentDebts}
        currency={currency}
      />

      <TransactionModal
        open={modal === "transaction"}
        initialType={quickTxType}
        accounts={f.accounts}
        categories={f.categories}
        onClose={close}
        onSubmit={f.addTransaction}
      />

      <QuickFabModal
        open={modal === "quick_fab"}
        onClose={close}
        onSelect={(action) => {
          close();
          setTimeout(() => {
            if (action === "account") setModal("account_add");
            if (action === "expense") {
              setQuickTxType("expense");
              setModal("transaction");
            }
            if (action === "income") {
              setQuickTxType("income");
              setModal("transaction");
            }
            if (action === "credit") setModal("credit_add");
            if (action === "debt") setModal("debt_add");
          }, 150);
        }}
      />

      <SideDrawerMenu
        open={modal === "menu_drawer"}
        onClose={close}
        categories={f.categories}
        onAddCategory={f.addCategory}
        onRemoveCategory={f.removeCategory}
        onExportCSV={f.exportToCSV}
        onResetData={f.resetData}
        accountsCount={f.accounts.length}
        txCount={f.transactions.length}
        onLogout={() => {
          f.updateAuth({ isAuthenticated: false });
          navigate({ to: "/" });
        }}
      />
    </main>
  );
}

/* ---------------- Header ---------------- */

function Header({
  onOpenSettings,
  onOpenRules,
  onOpenAlerts,
  alertsCount,
}: {
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenAlerts: () => void;
  alertsCount: number;
}) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex flex-1 justify-start">
        <button
          onClick={onOpenSettings}
          className="neu-surface gd-press flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium text-white/90 hover:text-white"
        >
          <SettingsIcon size={16} className="text-violet-300" />
          Настройки
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-lg font-bold tracking-wide text-white [text-shadow:0_0_18px_rgba(139,92,246,0.65)] leading-tight">
          Счета
        </h1>
        <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-0.5 opacity-80">
          <CheckCircle2 size={10} />
          <span>Все данные сохранены</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <button
          onClick={onOpenAlerts}
          className="neu-surface gd-press relative flex h-8 w-8 items-center justify-center rounded-xl text-white/90 hover:text-white"
        >
          <Bell size={16} className="text-amber-300" />
          {alertsCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#0d0b26]">
              {alertsCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenRules}
          className="neu-surface gd-press flex items-center justify-center h-8 w-8 rounded-xl text-amber-300 hover:text-amber-200"
        >
          <BookOpen size={16} />
        </button>
      </div>
    </header>
  );
}

/* ---------------- Summary Top Card ---------------- */

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

function Summary({
  balance,
  credits,
  debts,
  currency,
}: {
  balance: number;
  credits: number;
  debts: number;
  currency: CurrencySymbol;
}) {
  return (
    <div className="neu-surface mt-4 flex items-center justify-between rounded-2xl px-3.5 py-3 text-[12px]">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <Dot color="#3B82F6" />
          <span className="text-white/70">Баланс</span>
        </div>
        <span className="font-semibold text-white">{fmt(balance, currency)}</span>
      </div>

      <div className="h-6 w-px bg-white/10" />

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <Dot color="#EF4444" />
          <span className="text-white/70">Кредиты</span>
        </div>
        <span className="font-semibold text-red-300">{fmt(credits, currency)}</span>
      </div>

      <div className="h-6 w-px bg-white/10" />

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <Dot color="#F59E0B" />
          <span className="text-white/70">Долги</span>
        </div>
        <span className="font-semibold text-amber-300">{fmt(debts, currency)}</span>
      </div>
    </div>
  );
}

/* ---------------- Current Balance & Accounts ---------------- */

function BalanceBlock({
  accounts,
  total,
  currency,
  onAdd,
  onEdit,
  onDelete,
}: {
  accounts: Account[];
  total: number;
  currency: CurrencySymbol;
  onAdd: () => void;
  onEdit: (a: Account) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="mt-5">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.22em] text-white/50">ТЕКУЩИЙ БАЛАНС</p>
        <button
          onClick={onAdd}
          className="gd-press flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:text-violet-200"
        >
          <Plus size={14} /> + Счет
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="neu-surface flex flex-col items-center gap-3 rounded-2xl px-4 py-8 text-center">
          <div className="neu-inset flex h-12 w-12 items-center justify-center rounded-2xl text-violet-300">
            <CreditCard size={22} />
          </div>
          <p className="text-sm font-medium text-white/70">Нет добавленных счетов</p>
          <p className="text-xs text-white/40">Добавьте банковскую карту, наличные или вклад</p>
          <button
            onClick={onAdd}
            className="neon-violet gd-press mt-1 rounded-2xl bg-violet-600/85 px-5 py-2.5 text-xs font-semibold text-white"
          >
            Добавить счет
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {accounts.map((a) => (
            <PaymentCard
              key={a.id}
              account={a}
              currency={currency}
              onEdit={() => onEdit(a)}
              onDelete={() => onDelete(a.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PaymentCard({
  account,
  currency,
  onEdit,
  onDelete,
}: {
  account: Account;
  currency: CurrencySymbol;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const gradients: Record<string, string> = {
    blue: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #60a5fa 100%)",
    pink: "linear-gradient(135deg, #831843 0%, #ec4899 60%, #f9a8d4 100%)",
    emerald: "linear-gradient(135deg, #064e3b 0%, #10b981 60%, #34d399 100%)",
    violet: "linear-gradient(135deg, #4c1d95 0%, #8b5cf6 60%, #c084fc 100%)",
    amber: "linear-gradient(135deg, #78350f 0%, #f59e0b 60%, #fbbf24 100%)",
  };

  const glows: Record<string, string> = {
    blue: "0 0 22px rgba(59,130,246,0.45)",
    pink: "0 0 22px rgba(236,72,153,0.45)",
    emerald: "0 0 22px rgba(16,185,129,0.45)",
    violet: "0 0 22px rgba(139,92,246,0.45)",
    amber: "0 0 22px rgba(245,158,11,0.45)",
  };

  const colorKey = account.color || "blue";
  const grad = gradients[colorKey] || gradients.blue;
  const glow = glows[colorKey] || glows.blue;

  const typeLabel =
    account.type === "cash" ? "Наличные" : account.type === "deposit" ? "Вклад" : "Карта";

  const IconComponent =
    account.type === "cash" ? Coins : account.type === "deposit" ? Building2 : CreditCard;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-3.5 gd-press"
      style={{ background: grad, boxShadow: `${glow}, inset 0 1px 0 rgba(255,255,255,0.25)` }}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white/90">
          <IconComponent size={18} />
          <span className="text-[10px] uppercase tracking-wider text-white/70">{typeLabel}</span>
        </div>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          <button
            onClick={onEdit}
            title="Редактировать"
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/20 text-white/80 hover:bg-black/40 hover:text-white"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={onDelete}
            title="Удалить"
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/20 text-red-200 hover:bg-red-500/40"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <p className="mt-3 truncate text-[11px] font-semibold uppercase tracking-wider text-white/90">
        {account.name}
      </p>
      <p className="mt-0.5 text-lg font-bold text-white drop-shadow">
        {fmt(account.balance, currency)}
      </p>
    </div>
  );
}

/* ---------------- Net Available Panel ---------------- */

function NetPanel({
  net,
  balance,
  credits,
  debts,
  currency,
}: {
  net: number;
  balance: number;
  credits: number;
  debts: number;
  currency: CurrencySymbol;
}) {
  const positive = net >= 0;
  return (
    <section className="neu-surface mt-4 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-[0.24em] text-white/50">
            ИТОГО ДОСТУПНО
          </span>
          <p className="mt-0.5 text-xs text-white/45">
            Чистый баланс: (Счета) − (Кредиты) − (Долги)
          </p>
        </div>
        <span
          className={`text-2xl font-black tracking-tight ${
            positive
              ? "text-emerald-400 [text-shadow:0_0_18px_rgba(52,211,153,0.7)]"
              : "text-red-400 [text-shadow:0_0_18px_rgba(239,68,68,0.7)]"
          }`}
        >
          {fmt(net, currency)}
        </span>
      </div>
    </section>
  );
}

/* ---------------- Credits & Debts Block ---------------- */

function DangerBadge({ days }: { days: number }) {
  const label = days <= 0 ? "СЕГОДНЯ" : days === 1 ? "ЗАВТРА" : `${days} ДН.`;
  const breathe = days <= 1;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-red-300 ring-1 ring-red-500/40 ${
        breathe ? "gd-breathe" : ""
      }`}
    >
      🚨 {label}
    </span>
  );
}

function CreditsBlock({
  credits,
  total,
  currency,
  daysUntil,
  onAdd,
  onEdit,
  onDelete,
  onPay,
}: {
  credits: Credit[];
  total: number;
  currency: CurrencySymbol;
  daysUntil: (d?: string) => number | null;
  onAdd: () => void;
  onEdit: (c: Credit) => void;
  onDelete: (id: string) => void;
  onPay: (c: Credit) => void;
}) {
  const soonest = credits
    .map((c) => daysUntil(c.dueDate))
    .filter((d): d is number => d !== null && d <= 3)
    .sort((a, b) => a - b)[0];

  return (
    <div className="neu-surface flex flex-col justify-between rounded-2xl p-3">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wide text-red-300">Кредиты</h3>
          <div className="flex items-center gap-1">
            {soonest !== undefined && <DangerBadge days={soonest} />}
            <button
              onClick={onAdd}
              aria-label="Добавить кредит"
              className="gd-press p-1 text-violet-300 hover:text-white"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {credits.length === 0 ? (
          <button
            onClick={onAdd}
            className="gd-press mt-3 w-full rounded-xl bg-white/[0.03] px-2 py-4 text-center text-[11px] text-white/50"
          >
            Нет кредитов
            <span className="mt-1 block font-medium text-violet-300">+ Добавить</span>
          </button>
        ) : (
          <ul className="mt-2.5 space-y-2 text-[11px]">
            {credits.map((c) => (
              <li
                key={c.id}
                className="group relative flex flex-col rounded-xl bg-white/[0.04] p-2 hover:bg-white/[0.07]"
              >
                <div className="flex items-center justify-between">
                  <span className="max-w-[90px] truncate font-semibold text-white">{c.name}</span>
                  <span className="font-bold text-red-300">{fmt(c.amount, currency)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-white/50">
                  <span>
                    {c.rate ? `${c.rate}%` : ""}{" "}
                    {c.monthlyPayment ? `· ${fmt(c.monthlyPayment, currency)}/мес` : ""}
                  </span>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
                    <button
                      onClick={() => onPay(c)}
                      className="hover:text-emerald-300"
                      title="Внести платеж"
                    >
                      <Check size={11} />
                    </button>
                    <button onClick={() => onEdit(c)} className="hover:text-violet-300">
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => onDelete(c.id)} className="hover:text-red-300">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 flex justify-between border-t border-white/10 pt-2 text-[11px]">
        <span className="text-white/60">Итого:</span>
        <span className="font-bold text-red-300">{fmt(total, currency)}</span>
      </div>
    </div>
  );
}

function DebtsBlock({
  debts,
  total,
  currency,
  daysUntil,
  onAdd,
  onEdit,
  onDelete,
}: {
  debts: Debt[];
  total: number;
  currency: CurrencySymbol;
  daysUntil: (d?: string) => number | null;
  onAdd: () => void;
  onEdit: (d: Debt) => void;
  onDelete: (id: string) => void;
}) {
  const soonest = debts
    .map((d) => daysUntil(d.dueDate))
    .filter((days): days is number => days !== null && days <= 3)
    .sort((a, b) => a - b)[0];

  return (
    <div className="neu-surface rounded-2xl p-3 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-300 tracking-wide uppercase">Долги</h3>
          <div className="flex items-center gap-1">
            {soonest !== undefined && <DangerBadge days={soonest} />}
            <button
              onClick={onAdd}
              aria-label="Добавить долг"
              className="gd-press text-violet-300 p-1 hover:text-white"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {debts.length === 0 ? (
          <button
            onClick={onAdd}
            className="gd-press mt-3 w-full rounded-xl bg-white/[0.03] px-2 py-4 text-[11px] text-white/50 text-center"
          >
            Нет долгов
            <span className="mt-1 block text-violet-300 font-medium">+ Добавить</span>
          </button>
        ) : (
          <ul className="mt-2.5 space-y-2 text-[11px]">
            {debts.map((d) => {
              const isIOwe = d.type === "i_owe";
              return (
                <li
                  key={d.id}
                  className="group relative flex flex-col rounded-xl bg-white/[0.04] p-2 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[85px]">{d.name}</span>
                    <span className={`font-bold ${isIOwe ? "text-amber-300" : "text-emerald-300"}`}>
                      {fmt(d.amount, currency)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-white/50">
                    <span
                      className={`px-1 rounded ${isIOwe ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"}`}
                    >
                      {isIOwe ? "Я должен" : "Мне должны"}
                    </span>
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
                      <button onClick={() => onEdit(d)} className="hover:text-violet-300">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => onDelete(d.id)} className="hover:text-red-300">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-3 flex justify-between border-t border-white/10 pt-2 text-[11px]">
        <span className="text-white/60">Итого:</span>
        <span className="font-bold text-amber-300">{fmt(total, currency)}</span>
      </div>
    </div>
  );
}

/* ---------------- Expense Monthly Chart ---------------- */

function ExpenseChart({
  data,
  total,
  currency,
}: {
  data: number[];
  total: number;
  currency: CurrencySymbol;
}) {
  const w = 340,
    h = 85;
  const hasData = data.length > 0 && data.some((v) => v > 0);
  const max = hasData ? Math.max(...data) * 1.15 : 1;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const d = hasData
    ? data.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`).join(" ")
    : `M 0 ${h} L ${w} ${h}`;
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.22em] text-white/50">РАСХОДЫ ЗА МЕСЯЦ</p>
        <span className="text-xs font-bold text-fuchsia-300">
          {total > 0 ? `−${fmt(total, currency)}` : fmt(0, currency)}
        </span>
      </div>
      <div className="neu-surface rounded-2xl p-3">
        {hasData ? (
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
            <defs>
              <linearGradient id="gd-line" x1="0" x2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <linearGradient id="gd-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#gd-area)" />
            <path
              d={d}
              fill="none"
              stroke="url(#gd-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.8))" }}
            />
          </svg>
        ) : (
          <p className="py-6 text-center text-[11px] text-white/40">Нет расходов в этом месяце</p>
        )}
      </div>
    </section>
  );
}

/* ---------------- Recent Operations ---------------- */

function RecentOps({
  transactions,
  accounts,
  currency,
  onAdd,
  onDelete,
}: {
  transactions: Transaction[];
  accounts: Account[];
  currency: CurrencySymbol;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const list = transactions.slice(0, 8);
  const accName = (id?: string) => accounts.find((a) => a.id === id)?.name;

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.22em] text-white/50">ПОСЛЕДНИЕ ОПЕРАЦИИ</p>
        <button
          onClick={onAdd}
          className="gd-press flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:text-violet-200"
        >
          <Plus size={14} /> Операция
        </button>
      </div>

      {list.length === 0 ? (
        <div className="neu-surface flex flex-col items-center gap-3 rounded-2xl px-4 py-7 text-center">
          <div className="neu-inset flex h-12 w-12 items-center justify-center rounded-2xl text-violet-300">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-white/70">История операций пуста</p>
          <button
            onClick={onAdd}
            className="neon-violet gd-press rounded-2xl bg-violet-600/80 px-4 py-2 text-xs font-semibold"
          >
            Добавить операцию
          </button>
        </div>
      ) : (
        <div className="neu-surface divide-y divide-white/5 rounded-2xl">
          {list.map((op) => {
            const positive = op.type === "income";
            const Icon = positive ? TrendingUp : TrendingDown;
            return (
              <div
                key={op.id}
                className="group flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/[0.02]"
              >
                <div
                  className={`neu-inset flex h-9 w-9 items-center justify-center rounded-xl ${
                    positive ? "text-emerald-400" : "text-fuchsia-400"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{op.category}</p>
                  <p className="truncate text-[10px] text-white/45">
                    {new Date(op.date).toLocaleDateString("ru-RU")}
                    {accName(op.accountId) ? ` · ${accName(op.accountId)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      positive
                        ? "text-emerald-400 [text-shadow:0_0_10px_rgba(52,211,153,0.6)]"
                        : "text-red-400 [text-shadow:0_0_10px_rgba(239,68,68,0.6)]"
                    }`}
                  >
                    {positive ? "+" : "−"}
                    {fmt(op.amount, currency)}
                  </span>
                  <button
                    onClick={() => onDelete(op.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-300 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------------- Tab Views for Expenses, Income, History ---------------- */

function TransactionsTabView({
  title,
  type,
  transactions,
  accounts,
  total,
  currency,
  onAdd,
  onDelete,
}: {
  title: string;
  type: "expense" | "income";
  transactions: Transaction[];
  accounts: Account[];
  total: number;
  currency: CurrencySymbol;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const accName = (id?: string) => accounts.find((a) => a.id === id)?.name;
  const isExpense = type === "expense";

  return (
    <div className="mt-4 space-y-4">
      <div className="neu-surface flex items-center justify-between rounded-2xl p-4">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          <p className="text-xs text-white/50">
            Всего {isExpense ? "расходов" : "доходов"} в этом месяце
          </p>
        </div>
        <span
          className={`text-xl font-bold ${isExpense ? "text-fuchsia-300" : "text-emerald-400"}`}
        >
          {fmt(total, currency)}
        </span>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="neon-violet gd-press flex items-center gap-1.5 rounded-2xl bg-violet-600/85 px-4 py-2 text-xs font-semibold"
        >
          <Plus size={15} /> Добавить {isExpense ? "расход" : "доход"}
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="neu-surface flex flex-col items-center gap-3 rounded-2xl px-4 py-10 text-center">
          <p className="text-sm text-white/60">Записей пока нет</p>
        </div>
      ) : (
        <div className="neu-surface divide-y divide-white/5 rounded-2xl">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-xs font-semibold text-white">{t.category}</p>
                <p className="text-[10px] text-white/45">
                  {new Date(t.date).toLocaleDateString("ru-RU")}{" "}
                  {accName(t.accountId) ? `· ${accName(t.accountId)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${isExpense ? "text-red-400" : "text-emerald-400"}`}
                >
                  {isExpense ? "−" : "+"}
                  {fmt(t.amount, currency)}
                </span>
                <button onClick={() => onDelete(t.id)} className="text-white/40 hover:text-red-300">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryTabView({
  transactions,
  accounts,
  currency,
  onAdd,
  onDelete,
}: {
  transactions: Transaction[];
  accounts: Account[];
  currency: CurrencySymbol;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const filtered = transactions.filter((t) => (filter === "all" ? true : t.type === filter));
  const accName = (id?: string) => accounts.find((a) => a.id === id)?.name;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">История транзакций</h2>
        <button
          onClick={onAdd}
          className="neon-violet gd-press flex items-center gap-1 rounded-xl bg-violet-600/80 px-3 py-1.5 text-xs font-semibold"
        >
          <Plus size={14} /> Запись
        </button>
      </div>

      <div className="neu-inset grid grid-cols-3 gap-1 rounded-xl p-1 text-xs">
        {(["all", "expense", "income"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-1.5 rounded-lg font-medium transition ${
              filter === f ? "bg-violet-600/60 text-white" : "text-white/50"
            }`}
          >
            {f === "all" ? "Все" : f === "expense" ? "Расходы" : "Доходы"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="neu-surface p-8 text-center text-xs text-white/50 rounded-2xl">
          Нет транзакций
        </div>
      ) : (
        <div className="neu-surface divide-y divide-white/5 rounded-2xl">
          {filtered.map((t) => {
            const pos = t.type === "income";
            return (
              <div key={t.id} className="flex items-center justify-between p-3.5">
                <div>
                  <p className="text-xs font-semibold text-white">{t.category}</p>
                  <p className="text-[10px] text-white/45">
                    {new Date(t.date).toLocaleString("ru-RU")}{" "}
                    {accName(t.accountId) ? `· ${accName(t.accountId)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${pos ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {pos ? "+" : "−"}
                    {fmt(t.amount, currency)}
                  </span>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-white/40 hover:text-red-300"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Bottom Nav Bar ---------------- */

function BottomNav({
  activeTab,
  onTabChange,
  onOpenMenu,
}: {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenMenu: () => void;
}) {
  const items = [
    { id: "expenses" as const, icon: TrendingDown, label: "Расходы" },
    { id: "income" as const, icon: TrendingUp, label: "Доходы" },
    { id: "accounts" as const, icon: Wallet, label: "Счета" },
    { id: "history" as const, icon: HistoryIcon, label: "История" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-3 z-20 mx-auto max-w-[440px] px-4">
      <div className="neu-surface flex items-center justify-around rounded-2xl px-1.5 py-2 backdrop-blur-xl">
        {items.map((n) => {
          const Icon = n.icon;
          const active = activeTab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => onTabChange(n.id)}
              className={`gd-press flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition ${
                active ? "neon-violet bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <Icon
                size={18}
                className={
                  active
                    ? "text-fuchsia-300 [filter:drop-shadow(0_0_8px_rgba(217,70,239,0.9))]"
                    : "text-white/60"
                }
              />
              <span
                className={`text-[10px] font-medium ${active ? "text-fuchsia-200" : "text-white/60"}`}
              >
                {n.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={onOpenMenu}
          className="gd-press flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 hover:bg-white/5 text-white/60"
        >
          <MenuIcon size={18} />
          <span className="text-[10px] font-medium">Меню</span>
        </button>
      </div>
    </nav>
  );
}

/* ---------------- All Modals ---------------- */

/* 1. Settings Modal */
function SettingsModal({
  open,
  onClose,
  settings,
  onUpdate,
  onResetData,
  auth,
  onUpdateAuth,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  settings: {
    currency: CurrencySymbol;
    theme: AppTheme;
    reminders: boolean;
    limitAlerts: boolean;
    soundEffects: boolean;
  };
  onUpdate: (s: Partial<typeof settings>) => void;
  onResetData: () => void;
  auth?: { isAuthenticated: boolean; pin: string };
  onUpdateAuth?: (s: Partial<NonNullable<typeof auth>>) => void;
  onLogout: () => void;
}) {
  const currencies: CurrencySymbol[] = ["₼", "$", "€", "₽"];

  const [localSettings, setLocalSettings] = useState(settings);
  const [localPin, setLocalPin] = useState(auth?.pin || "");

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
      setLocalPin(auth?.pin || "");
    }
  }, [open, settings, auth?.pin]);

  return (
    <NeonModal open={open} title="Настройки приложения" onClose={onClose}>
      <div className="space-y-4 text-xs">
        {/* Currency selection */}
        <div>
          <label className="mb-2 block font-semibold text-white/70">ОСНОВНАЯ ВАЛЮТА</label>
          <div className="neu-inset grid grid-cols-4 gap-1.5 rounded-xl p-1.5">
            {currencies.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setLocalSettings((prev) => ({ ...prev, currency: c }))}
                className={`rounded-lg py-2 text-sm font-bold transition ${
                  localSettings.currency === c
                    ? "bg-violet-600 text-white [box-shadow:0_0_12px_rgba(139,92,246,0.6)]"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Theme selection */}
        <div>
          <label className="mb-2 block font-semibold text-white/70">ТЕМА ОФОРМЛЕНИЯ</label>
          <div className="neu-inset grid grid-cols-3 gap-1 rounded-xl p-1">
            {[
              { id: "cosmos" as const, name: "Космос" },
              { id: "neon" as const, name: "Неон" },
              { id: "midnight" as const, name: "Полночь" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setLocalSettings((prev) => ({ ...prev, theme: t.id }))}
                className={`rounded-lg py-1.5 font-medium transition ${
                  localSettings.theme === t.id ? "bg-violet-600 text-white" : "text-white/50"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* PIN Code settings */}
        <div>
          <label className="mb-2 block font-semibold text-white/70">PIN-КОД ДЛЯ ВХОДА</label>
          <div className="neu-inset flex items-center gap-3 rounded-xl px-3 py-2">
            <Lock size={16} className="text-violet-300" />
            <input
              type="password"
              placeholder="Установить PIN-код"
              value={localPin}
              onChange={(e) => setLocalPin(e.target.value)}
              className="w-full bg-transparent text-white placeholder:text-white/40 outline-none"
            />
          </div>
        </div>

        {/* Notification toggles */}
        <div className="space-y-2 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-white/80">
              <Bell size={15} className="text-violet-300" /> Уведомления о платежах
            </span>
            <input
              type="checkbox"
              checked={localSettings.reminders}
              onChange={(e) =>
                setLocalSettings((prev) => ({ ...prev, reminders: e.target.checked }))
              }
              className="accent-violet-500 h-4 w-4 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-white/80">
              <ShieldAlert size={15} className="text-amber-300" /> Предупреждения о лимитах
            </span>
            <input
              type="checkbox"
              checked={localSettings.limitAlerts}
              onChange={(e) =>
                setLocalSettings((prev) => ({ ...prev, limitAlerts: e.target.checked }))
              }
              className="accent-violet-500 h-4 w-4 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-white/80">
              <Volume2 size={15} className="text-fuchsia-300" /> Звуковые эффекты
            </span>
            <input
              type="checkbox"
              checked={localSettings.soundEffects}
              onChange={(e) =>
                setLocalSettings((prev) => ({ ...prev, soundEffects: e.target.checked }))
              }
              className="accent-violet-500 h-4 w-4 rounded"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 pt-4">
          <button
            onClick={() => {
              onClose();
              setLocalSettings(settings);
              setLocalPin(auth?.pin || "");
            }}
            className="neu-surface flex flex-1 items-center justify-center rounded-xl py-3 font-semibold text-white/70 hover:text-white"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              onUpdate(localSettings);
              if (onUpdateAuth) {
                onUpdateAuth({ pin: localPin });
              }
              toast.success("Настройки успешно сохранены!");
              onClose();
            }}
            className="neon-violet gd-press flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600/90 py-3 font-semibold text-white hover:bg-violet-500"
          >
            <Check size={16} /> Сохранить
          </button>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
          >
            <LogOut size={14} /> Выйти из аккаунта
          </button>
          <button
            onClick={() => {
              if (
                confirm("Удалить все данные? Приложение вернется к начальному пустому состоянию.")
              ) {
                onResetData();
                onClose();
              }
            }}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-red-500/20 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
          >
            <RefreshCw size={14} /> Сбросить все данные
          </button>
        </div>
      </div>
    </NeonModal>
  );
}

/* 2. Rules / Help Modal */
function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <NeonModal open={open} title="Справочник и Правила" onClose={onClose}>
      <div className="space-y-3.5 text-xs text-white/80 max-h-[70vh] overflow-y-auto pr-1">
        <div className="neu-inset rounded-xl p-3">
          <h3 className="font-bold text-amber-300 text-sm mb-1">💳 1. Счета</h3>
          <p className="text-white/70">
            Счета хранят ваши активные средства (карты, наличные, вклады). Добавление дохода
            увеличивает баланс выбранного счета, а расход вычитает средства.
          </p>
        </div>

        <div className="neu-inset rounded-xl p-3">
          <h3 className="font-bold text-red-300 text-sm mb-1">🏦 2. Кредиты</h3>
          <p className="text-white/70">
            Фиксируют обязательства перед банками с указанием процентной ставки и ежемесячного
            платежа.
          </p>
        </div>

        <div className="neu-inset rounded-xl p-3">
          <h3 className="font-bold text-amber-300 text-sm mb-1">🤝 3. Долги</h3>
          <p className="text-white/70">
            Разделяются на «Я должен» (ваши задолженности) и «Мне должны» (средства, которые вам
            вернут).
          </p>
        </div>

        <div className="neu-inset rounded-xl p-3">
          <h3 className="font-bold text-emerald-300 text-sm mb-1">📐 4. Формула Чистого Остатка</h3>
          <p className="font-mono text-[11px] text-emerald-200 mt-1">
            Чистый остаток = (Счета + Мне должны) − (Кредиты + Я должен)
          </p>
        </div>

        <div className="neu-inset rounded-xl p-3">
          <h3 className="font-bold text-violet-300 text-sm mb-1">⚡ 5. Быстрый FAB («+»)</h3>
          <p className="text-white/70">
            Плавающая кнопка в правом нижнем углу позволяет мгновенно добавить счет, доход, расход,
            кредит или долг.
          </p>
        </div>
      </div>
    </NeonModal>
  );
}

/* 3. Account Form Modal (Add & Edit) */
function AccountFormModal({
  open,
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initialData?: Account;
  onClose: () => void;
  onSubmit: (a: Omit<Account, "id">) => void;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [balance, setBalance] = useState(initialData?.balance?.toString() ?? "");
  const [type, setType] = useState<AccountType>(initialData?.type ?? "card");
  const [color, setColor] = useState(initialData?.color ?? "blue");

  const colors = [
    { id: "blue", bg: "#3B82F6", label: "Синий" },
    { id: "pink", bg: "#EC4899", label: "Розовый" },
    { id: "emerald", bg: "#10B981", label: "Изумруд" },
    { id: "violet", bg: "#8B5CF6", label: "Фиолет" },
    { id: "amber", bg: "#F59E0B", label: "Янтарь" },
  ];

  return (
    <NeonModal open={open} title={title} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSubmit({
            name: name.trim(),
            balance: Number(balance) || 0,
            type,
            color,
          });
          onClose();
        }}
      >
        <NeonField label="НАЗВАНИЕ СЧЕТА">
          <input
            className={neonInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Основная Visa, Наличные..."
            required
          />
        </NeonField>

        <NeonField label="НАЧАЛЬНЫЙ БАЛАНС">
          <input
            className={neonInputClass}
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0"
          />
        </NeonField>

        <NeonField label="ТИП СЧЕТА">
          <div className="neu-inset grid grid-cols-3 gap-1 rounded-xl p-1 text-xs">
            {[
              { id: "card" as const, name: "Карта" },
              { id: "cash" as const, name: "Наличные" },
              { id: "deposit" as const, name: "Вклад" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`py-2 rounded-lg font-semibold transition ${
                  type === t.id ? "bg-violet-600 text-white" : "text-white/50"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </NeonField>

        <NeonField label="ЦВЕТ КАРТОЧКИ">
          <div className="flex items-center justify-between gap-2 pt-1">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`h-8 w-8 rounded-full transition-transform ${
                  color === c.id ? "scale-110 ring-2 ring-white" : "opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: c.bg }}
              />
            ))}
          </div>
        </NeonField>

        <button type="submit" className={neonSubmitClass}>
          Сохранить счет
        </button>
      </form>
    </NeonModal>
  );
}

/* 4. Credit Form Modal (Add & Edit) */
function CreditFormModal({
  open,
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initialData?: Credit;
  onClose: () => void;
  onSubmit: (c: Omit<Credit, "id">) => void;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [rate, setRate] = useState(initialData?.rate?.toString() ?? "");
  const [monthlyPayment, setMonthlyPayment] = useState(
    initialData?.monthlyPayment?.toString() ?? "",
  );
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");

  return (
    <NeonModal open={open} title={title} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const val = Number(amount);
          if (!name.trim() || !val) return;
          onSubmit({
            name: name.trim(),
            amount: Math.abs(val),
            rate: rate ? Number(rate) : undefined,
            monthlyPayment: monthlyPayment ? Number(monthlyPayment) : undefined,
            dueDate: dueDate || undefined,
            note: note.trim() || undefined,
          });
          onClose();
        }}
      >
        <NeonField label="НАЗВАНИЕ КРЕДИТА">
          <input
            className={neonInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ипотека, автокредит..."
            required
          />
        </NeonField>

        <NeonField label="СУММА КРЕДИТА">
          <input
            className={neonInputClass}
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
          />
        </NeonField>

        <div className="grid grid-cols-2 gap-2">
          <NeonField label="СТАВКА (%)">
            <input
              className={neonInputClass}
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="12.5"
            />
          </NeonField>

          <NeonField label="ПЛАТЕЖ В МЕСЯЦ">
            <input
              className={neonInputClass}
              type="number"
              step="0.01"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
              placeholder="0"
            />
          </NeonField>
        </div>

        <NeonField label="СРОК СЛЕДУЮЩЕЙ ОПЛАТЫ">
          <input
            className={neonInputClass}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </NeonField>

        <NeonField label="ОПИСАНИЕ / БАНК">
          <input
            className={neonInputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Заметка"
          />
        </NeonField>

        <button type="submit" className={neonSubmitClass}>
          Сохранить кредит
        </button>
      </form>
    </NeonModal>
  );
}

/* 5. Debt Form Modal (Add & Edit) */
function DebtFormModal({
  open,
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initialData?: Debt;
  onClose: () => void;
  onSubmit: (d: Omit<Debt, "id">) => void;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState<DebtType>(initialData?.type ?? "i_owe");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");

  return (
    <NeonModal open={open} title={title} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const val = Number(amount);
          if (!name.trim() || !val) return;
          onSubmit({
            name: name.trim(),
            type,
            amount: Math.abs(val),
            dueDate: dueDate || undefined,
            note: note.trim() || undefined,
          });
          onClose();
        }}
      >
        <NeonField label="ТИП ДОЛГА">
          <div className="neu-inset grid grid-cols-2 gap-1 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setType("i_owe")}
              className={`py-2 rounded-lg font-semibold transition ${
                type === "i_owe" ? "bg-amber-500/30 text-amber-200" : "text-white/50"
              }`}
            >
              Я должен
            </button>
            <button
              type="button"
              onClick={() => setType("owed_to_me")}
              className={`py-2 rounded-lg font-semibold transition ${
                type === "owed_to_me" ? "bg-emerald-500/30 text-emerald-200" : "text-white/50"
              }`}
            >
              Мне должны
            </button>
          </div>
        </NeonField>

        <NeonField label="ИМЯ (КТО / КОМУ)">
          <input
            className={neonInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя человека или организации"
            required
          />
        </NeonField>

        <NeonField label="СУММА">
          <input
            className={neonInputClass}
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
          />
        </NeonField>

        <NeonField label="СРОК ВОЗВРАТА">
          <input
            className={neonInputClass}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </NeonField>

        <NeonField label="ЗАМЕТКА">
          <input
            className={neonInputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="За что долг..."
          />
        </NeonField>

        <button type="submit" className={neonSubmitClass}>
          Сохранить долг
        </button>
      </form>
    </NeonModal>
  );
}

/* 6. Transaction Modal (Expense / Income) */
function TransactionModal({
  open,
  initialType,
  accounts,
  categories,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialType: "expense" | "income";
  accounts: Account[];
  categories: { id: string; name: string; type: "expense" | "income" }[];
  onClose: () => void;
  onSubmit: (t: {
    type: "expense" | "income";
    category: string;
    amount: number;
    accountId?: string;
  }) => void;
}) {
  const [type, setType] = useState<"expense" | "income">(initialType);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");

  const filteredCats = categories.filter((c) => c.type === type);

  return (
    <NeonModal open={open} title="Новая операция" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const val = Number(amount);
          if (!category.trim() || !val) return;
          onSubmit({
            type,
            category: category.trim(),
            amount: Math.abs(val),
            accountId: accountId || undefined,
          });
          onClose();
        }}
      >
        <div className="neu-inset grid grid-cols-2 gap-1 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setCategory("");
            }}
            className={`py-2 rounded-lg font-semibold transition ${
              type === "expense" ? "bg-red-500/20 text-red-300" : "text-white/50"
            }`}
          >
            Расход
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              setCategory("");
            }}
            className={`py-2 rounded-lg font-semibold transition ${
              type === "income" ? "bg-emerald-500/20 text-emerald-300" : "text-white/50"
            }`}
          >
            Доход
          </button>
        </div>

        <NeonField label="КАТЕГОРИЯ">
          <div className="space-y-2">
            <input
              className={neonInputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Продукты, Кафе, Зарплата..."
              required
            />
            {filteredCats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {filteredCats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] text-white/80 hover:bg-white/20"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </NeonField>

        <NeonField label="СУММА">
          <input
            className={neonInputClass}
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
          />
        </NeonField>

        <NeonField label="СПИСАТЬ / ЗАЧИСЛИТЬ НА СЧЕТ">
          <select
            className={neonInputClass}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="" className="bg-[#140a33]">
              Без привязки к счету
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#140a33]">
                {a.name} ({a.balance})
              </option>
            ))}
          </select>
        </NeonField>

        <button type="submit" className={neonSubmitClass}>
          Сохранить операцию
        </button>
      </form>
    </NeonModal>
  );
}

/* 7. Quick FAB Selector Modal */
function QuickFabModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (action: "account" | "expense" | "income" | "credit" | "debt") => void;
}) {
  if (!open) return null;

  const actions = [
    {
      id: "expense" as const,
      name: "Добавить расход",
      icon: TrendingDown,
      color: "text-red-400 bg-red-500/10",
    },
    {
      id: "income" as const,
      name: "Добавить доход",
      icon: TrendingUp,
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      id: "account" as const,
      name: "Добавить счет",
      icon: Wallet,
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      id: "credit" as const,
      name: "Добавить кредит",
      icon: CreditCard,
      color: "text-fuchsia-400 bg-fuchsia-500/10",
    },
    {
      id: "debt" as const,
      name: "Добавить долг",
      icon: Coins,
      color: "text-amber-400 bg-amber-500/10",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-20 backdrop-blur-sm">
      <div className="neu-surface gd-fade-in w-full max-w-[400px] rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Быстрое действие</h2>
          <button
            onClick={onClose}
            className="neu-inset flex h-8 w-8 items-center justify-center rounded-xl text-white/70"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => onSelect(act.id)}
                className="neu-surface gd-press flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/10"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${act.color}`}
                >
                  <Icon size={20} />
                </div>
                <span className="text-sm font-semibold text-white">{act.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* 8. Slide-over Side Drawer Menu */
function SideDrawerMenu({
  open,
  onClose,
  categories,
  onAddCategory,
  onRemoveCategory,
  onExportCSV,
  onResetData,
  onLogout,
  accountsCount,
  txCount,
}: {
  open: boolean;
  onClose: () => void;
  categories: { id: string; name: string; type: "expense" | "income" }[];
  onAddCategory: (c: { name: string; type: "expense" | "income" }) => void;
  onRemoveCategory: (id: string) => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onLogout: () => void;
  accountsCount: number;
  txCount: number;
}) {
  const [menuTab, setMenuTab] = useState<"menu" | "categories" | "analytics">("menu");
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="gd-cosmos relative h-full w-full max-w-[340px] border-l border-white/10 p-5 overflow-y-auto text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <User size={20} className="text-violet-300" />
            <h2 className="text-base font-bold text-white">Меню управления</h2>
          </div>
          <button
            onClick={onClose}
            className="neu-inset flex h-8 w-8 items-center justify-center rounded-xl text-white/70"
          >
            <X size={16} />
          </button>
        </div>

        {menuTab === "menu" && (
          <div className="mt-5 space-y-3">
            <button
              onClick={() => setMenuTab("categories")}
              className="neu-surface gd-press flex w-full items-center gap-3 rounded-2xl p-3.5 text-left hover:bg-white/10"
            >
              <Tag size={18} className="text-violet-300" />
              <div>
                <p className="text-sm font-semibold text-white">Категории</p>
                <p className="text-[10px] text-white/50">
                  Управление категориями расходов и доходов
                </p>
              </div>
            </button>

            <button
              onClick={() => setMenuTab("analytics")}
              className="neu-surface gd-press flex w-full items-center gap-3 rounded-2xl p-3.5 text-left hover:bg-white/10"
            >
              <PieChart size={18} className="text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-white">Аналитика</p>
                <p className="text-[10px] text-white/50">Статистика расходов и сводка</p>
              </div>
            </button>

            <button
              onClick={() => {
                onExportCSV();
                onClose();
              }}
              className="neu-surface gd-press flex w-full items-center gap-3 rounded-2xl p-3.5 text-left hover:bg-white/10"
            >
              <Download size={18} className="text-fuchsia-300" />
              <div>
                <p className="text-sm font-semibold text-white">Экспорт данных (CSV)</p>
                <p className="text-[10px] text-white/50">Скачать отчет для Excel</p>
              </div>
            </button>

            <div className="neu-surface rounded-2xl p-4 mt-6">
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
                Профиль пользователя
              </h3>
              <p className="text-xs text-white/60">G-Digital Finance Account</p>
              <div className="mt-3 flex justify-between text-[11px] text-white/50 border-t border-white/10 pt-2">
                <span>Счетов: {accountsCount}</span>
                <span>Операций: {txCount}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <LogOut size={18} />
              Выйти из аккаунта
            </button>
          </div>
        )}

        {menuTab === "categories" && (
          <div className="mt-4 space-y-4">
            <button
              onClick={() => setMenuTab("menu")}
              className="text-xs text-violet-300 flex items-center gap-1 font-semibold"
            >
              ← Назад в меню
            </button>
            <h3 className="text-sm font-bold text-white">Категории операций</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCatName.trim()) return;
                onAddCategory({ name: newCatName.trim(), type: newCatType });
                setNewCatName("");
              }}
              className="space-y-2 rounded-xl bg-white/5 p-3"
            >
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Новая категория..."
                className={neonInputClass}
              />
              <div className="flex gap-2">
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as "expense" | "income")}
                  className="bg-[#140a33] text-xs text-white p-2 rounded-xl border border-white/10 flex-1"
                >
                  <option value="expense">Расход</option>
                  <option value="income">Доход</option>
                </select>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white"
                >
                  +
                </button>
              </div>
            </form>

            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs"
                >
                  <span>{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        c.type === "expense"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {c.type === "expense" ? "Расход" : "Доход"}
                    </span>
                    <button
                      onClick={() => onRemoveCategory(c.id)}
                      className="text-white/40 hover:text-red-300"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {menuTab === "analytics" && (
          <div className="mt-4 space-y-4">
            <button
              onClick={() => setMenuTab("menu")}
              className="text-xs text-violet-300 flex items-center gap-1 font-semibold"
            >
              ← Назад в меню
            </button>
            <h3 className="text-sm font-bold text-white">Аналитика финансов</h3>
            <div className="neu-surface rounded-2xl p-4 text-center space-y-2">
              <PieChart size={32} className="mx-auto text-violet-300" />
              <p className="text-xs text-white/80 font-semibold">Структура бюджетов активна</p>
              <p className="text-[11px] text-white/50">
                Все категории расходов и доходов автоматически сопоставляются и учитываются при
                построении месячных графиков.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* 9. Credit Pay Modal */
function CreditPayModal({
  open,
  credit,
  accounts,
  onClose,
  onPay,
}: {
  open: boolean;
  credit: Credit;
  accounts: Account[];
  onClose: () => void;
  onPay: (accountId: string, amount: number) => void;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [amount, setAmount] = useState(credit.monthlyPayment?.toString() || "");

  return (
    <NeonModal open={open} title="Внести платеж" onClose={onClose}>
      <div className="mb-4 rounded-xl bg-white/5 p-3">
        <p className="text-sm font-bold text-white">{credit.name}</p>
        <p className="text-xs text-white/60">
          Текущий долг: <span className="text-red-300 font-semibold">{credit.amount}</span>
        </p>
      </div>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const val = Number(amount);
          if (accountId && val > 0) {
            onPay(accountId, val);
          }
        }}
      >
        <NeonField label="СУММА ПЛАТЕЖА">
          <input
            className={neonInputClass}
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </NeonField>

        <NeonField label="СПИСАТЬ СО СЧЕТА">
          <select
            className={neonInputClass}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            <option value="" disabled className="bg-[#140a33]">
              Выберите счет
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#140a33]">
                {a.name} ({a.balance})
              </option>
            ))}
          </select>
        </NeonField>

        <button type="submit" className={neonSubmitClass} disabled={accounts.length === 0}>
          {accounts.length === 0 ? "Нет доступных счетов" : "Внести платеж"}
        </button>
      </form>
    </NeonModal>
  );
}

/* 10. Alerts Modal */
function AlertsModal({
  open,
  onClose,
  urgentCredits,
  urgentDebts,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  urgentCredits: Credit[];
  urgentDebts: Debt[];
  currency: CurrencySymbol;
}) {
  return (
    <NeonModal open={open} title="Срочные платежи" onClose={onClose}>
      {urgentCredits.length === 0 && urgentDebts.length === 0 ? (
        <p className="py-6 text-center text-xs text-white/50">Нет срочных платежей</p>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {urgentCredits.map((c) => (
            <div
              key={c.id}
              className="neu-inset flex items-center justify-between rounded-xl p-3 border border-red-500/30"
            >
              <div>
                <p className="text-xs font-bold text-white">{c.name}</p>
                <p className="text-[10px] text-white/60">
                  Кредит ·{" "}
                  {c.dueDate ? new Date(c.dueDate).toLocaleDateString("ru-RU") : "Нет даты"}
                </p>
              </div>
              <span className="text-sm font-bold text-red-300">
                {fmt(c.monthlyPayment || c.amount, currency)}
              </span>
            </div>
          ))}

          {urgentDebts.map((d) => (
            <div
              key={d.id}
              className="neu-inset flex items-center justify-between rounded-xl p-3 border border-amber-500/30"
            >
              <div>
                <p className="text-xs font-bold text-white">{d.name}</p>
                <p className="text-[10px] text-white/60">
                  Долг · {d.dueDate ? new Date(d.dueDate).toLocaleDateString("ru-RU") : "Нет даты"}
                </p>
              </div>
              <span className="text-sm font-bold text-amber-300">{fmt(d.amount, currency)}</span>
            </div>
          ))}
        </div>
      )}
    </NeonModal>
  );
}
