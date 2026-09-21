/*
 * Debt payoff simulation. No minimum-payment concept -- unpaid bills
 * and Betreibung debt usually don't have a contractual minimum the
 * way a credit card does, you're simply paying nothing on them yet.
 * So every month, interest accrues on every open debt, and the whole
 * monthly budget is split evenly across every debt that's still open,
 * until all of them reach zero.
 */
const DebtPlanner = {
  MAX_MONTHS: 600, // 50 years safety cap so a bad input can't loop forever

  simulate(inputDebts, monthlyBudget) {
    const debts = inputDebts.map((d) => ({
      id: d.id,
      name: d.name,
      balance: Number(d.balance) || 0,
      apr: Number(d.apr) || 0
    }));

    if (debts.length === 0) {
      return { feasible: true, empty: true };
    }

    const payoffMonth = {};
    const interestPaid = {};
    debts.forEach((d) => {
      payoffMonth[d.id] = null;
      interestPaid[d.id] = 0;
    });

    const balanceHistory = [debts.reduce((sum, d) => sum + d.balance, 0)];
    let totalInterestPaid = 0;
    let month = 0;
    const budget = Number(monthlyBudget) || 0;

    while (debts.some((d) => d.balance > 0.005) && month < this.MAX_MONTHS) {
      month++;

      // 1. accrue interest on every open debt
      for (const debt of debts) {
        if (debt.balance <= 0.005) continue;
        const monthlyInterest = (debt.balance * (debt.apr / 100)) / 12;
        debt.balance += monthlyInterest;
        totalInterestPaid += monthlyInterest;
        interestPaid[debt.id] += monthlyInterest;
      }

      // 2. split the whole monthly budget evenly across every open debt
      const openDebts = debts.filter((d) => d.balance > 0.005);
      if (budget > 0 && openDebts.length > 0) {
        const share = budget / openDebts.length;
        for (const debt of openDebts) {
          const payment = Math.min(share, debt.balance);
          debt.balance -= payment;
          if (debt.balance <= 0.005 && payoffMonth[debt.id] === null) {
            payoffMonth[debt.id] = month;
          }
        }
      }

      balanceHistory.push(debts.reduce((sum, d) => sum + Math.max(d.balance, 0), 0));
    }

    const feasible = debts.every((d) => d.balance <= 0.005);

    return {
      feasible,
      empty: false,
      totalMonths: month,
      totalInterestPaid,
      balanceHistory,
      order: debts.map((d) => {
        const original = inputDebts.find((o) => o.id === d.id);
        return {
          id: d.id,
          name: original.name,
          creditorType: original.creditorType || DEFAULT_CREDITOR_TYPE,
          payoffMonth: payoffMonth[d.id],
          interestPaid: interestPaid[d.id]
        };
      })
    };
  },

  /*
   * Turns the simulation result into a concrete "who gets how many CHF,
   * and until when" schedule. A new phase starts every time a debt is
   * fully paid off, since that's when the budget gets redivided among
   * fewer, remaining debts (a bigger share each).
   */
  derivePaymentPlan(order, monthlyBudget) {
    const byPayoff = order.filter((d) => d.payoffMonth !== null).sort((a, b) => a.payoffMonth - b.payoffMonth);
    let openDebts = order.map((d) => ({ id: d.id, name: d.name }));
    let prevMonth = 0;
    const budget = Number(monthlyBudget) || 0;
    const phases = [];

    byPayoff.forEach((entry) => {
      const fromMonth = prevMonth + 1;
      const toMonth = Math.max(entry.payoffMonth, fromMonth);
      const share = openDebts.length > 0 ? budget / openDebts.length : 0;

      phases.push({
        fromMonth,
        toMonth,
        targetName: entry.name,
        payments: openDebts.map((d) => ({ id: d.id, name: d.name, amount: share }))
      });

      openDebts = openDebts.filter((d) => d.id !== entry.id);
      prevMonth = entry.payoffMonth;
    });

    return phases;
  }
};
