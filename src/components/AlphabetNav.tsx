interface Props { value: string; onChange: (value: string) => void }
export function AlphabetNav({ value, onChange }: Props) {
  return <nav className="alphabet-nav" aria-label="首字母筛选">
    {['all', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter => <button key={letter} aria-pressed={value === letter}
      onClick={() => onChange(letter)}>{letter === 'all' ? '全部字母' : letter}</button>)}
  </nav>
}
