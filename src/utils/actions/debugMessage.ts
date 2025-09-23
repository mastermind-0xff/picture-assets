import { ImageResizeConfig } from '../../config/main';
import { sec } from 'style-escape-codes';

export type DebugMessageType = 'error' | 'warning' | 'notification' | 'success';

export const debugMessage = (
  message: string,
  type: DebugMessageType,
  enableDebug: boolean = ImageResizeConfig.DEBUG
) => {
  if (!enableDebug) return;
  let styledMessage: string;
  switch (type) {
    case 'error':
      styledMessage = '🛑 ';
      styledMessage += sec.u.o.b.fg.hex('f00').bg.hsl(0, 50, 20);
      styledMessage += `Error:${sec.b.unset()} ${message}`;
      break;
    case 'warning':
      styledMessage = '⚠️  ';
      styledMessage += sec.u.o.b.fg.hex('ff0').bg.hsl(60, 50, 20);
      styledMessage += `Warning:${sec.b.unset()} ${message}`;
      break;
    case 'success':
      styledMessage = '✅ ';
      styledMessage += sec.u.o.b.fg.hex('0f0').bg.hsl(120, 50, 20);
      styledMessage += `Success:${sec.b.unset()} ${message}`;
      break;
    case 'notification':
      styledMessage = '🟦 ';
      styledMessage += sec.u.o.b.fg.hex('0ff').bg.hsl(180, 50, 20);
      styledMessage += `Notification:${sec.b.unset()} ${message}`;
      break;
  }
  styledMessage += sec.u.o.fg.bg.unset();
  console.log(styledMessage);
};
