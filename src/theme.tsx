import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';

const theme = createTheme({
  palette: {
    primary: { main: '#a71850', light: '#fce9f1', dark: '#871442' },
    text: { primary: '#282326', secondary: '#665b62' },
    divider: '#e9e0e5',
  },
  typography: {
    fontFamily: 'system-ui, "PingFang TC", "Microsoft JhengHei", sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 8 },
});

export function ShowroomTheme({ children }: { children: ReactNode }) {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
}
