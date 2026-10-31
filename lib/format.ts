export function formatPersonName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  // Split by comma for academic degrees or certifications: e.g. 'AMELIA DWI FITRIANI, S.Tr.AP'
  const commaParts = trimmed.split(',');
  const mainName = commaParts[0].trim();

  const titleCaseWord = (w: string): string => {
    if (!w) return '';
    if (w.includes('-')) {
      return w.split('-').map(titleCaseWord).join('-');
    }
    // Single letter with or without a dot, e.g. 'H.' or 'A.'
    if (/^[A-Za-z]\.?$/.test(w)) {
      return w.toUpperCase();
    }
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  };

  const formattedMain = mainName
    .split(/\s+/)
    .map(titleCaseWord)
    .join(' ');

  if (commaParts.length > 1) {
    const degrees = commaParts.slice(1).map(deg => {
      const dTrimmed = deg.trim();
      // If the user already wrote mixed case degrees like 'S.Tr.AP' or 'A.Md' or 'M.Sc'
      if (/[a-z]/.test(dTrimmed)) {
        return dTrimmed;
      }
      // If degree was all caps, e.g. 'A.MD', 'S.TR.AP', 'S.KOM'
      return dTrimmed
        .split(' ')
        .map(part => {
          return part
            .split('.')
            .map((seg) => {
              if (seg.length <= 1) return seg.toUpperCase();
              const lower = seg.toLowerCase();
              if (lower === 'md') return 'Md';
              if (lower === 'tr') return 'Tr';
              if (lower === 'kom') return 'Kom';
              if (lower === 'ked') return 'Ked';
              if (lower === 'farm') return 'Farm';
              if (lower === 'ap') return 'AP';
              return seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase();
            })
            .join('.');
        })
        .join(' ');
    }).join(', ');

    return `${formattedMain}, ${degrees}`;
  }

  return formattedMain;
}

export function formatSentenceCase(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (trimmed === trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()) {
    return trimmed.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  }
  return trimmed;
}
