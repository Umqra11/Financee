export function BudgetProgressBar({ spent, limit }: { spent: number; limit: number }) {
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  
  const getProgressColor = (perc: number) => {
    if (perc < 80) return 'bg-zinc-800 dark:bg-zinc-200'; 
    if (perc < 100) return 'bg-amber-500'; 
    return 'bg-red-500'; 
  };
  
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium">Kullanılan: ₺{spent}</span><span>Limit: ₺{limit}</span>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div className={`h-full transition-all duration-700 ease-in-out rounded-full ${getProgressColor(percentage)}`} style={{ width: `${percentage}%` }} />
      </div>
      {percentage >= 80 && (
        <p className={`text-xs mt-1 font-medium ${percentage >= 100 ? 'text-red-500' : 'text-amber-500'}`}>
          {percentage >= 100 ? 'Dikkat: Bütçe limitinizi aştınız!' : 'Bütçe limitinize yaklaşıyorsunuz.'}
        </p>
      )}
    </div>
  );
}
