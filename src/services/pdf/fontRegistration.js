import { Font } from '@react-pdf/renderer'
import SulaimanLipiFont from '../../assets/fonts/SulaimanLipi.ttf'

let isRegistered = false

export function registerFonts() {
  if (isRegistered) return

  Font.register({
    family: 'SulaimanLipi',
    src: SulaimanLipiFont,
  })

  isRegistered = true
}
