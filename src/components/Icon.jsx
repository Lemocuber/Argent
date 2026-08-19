import accountBalance from '@material-symbols/svg-300/sharp/account_balance.svg'
import accountBalanceFill from '@material-symbols/svg-300/sharp/account_balance-fill.svg'
import add from '@material-symbols/svg-300/sharp/add.svg'
import addChart from '@material-symbols/svg-300/sharp/add_chart.svg'
import allInclusive from '@material-symbols/svg-300/sharp/all_inclusive.svg'
import allInclusiveFill from '@material-symbols/svg-300/sharp/all_inclusive-fill.svg'
import backspace from '@material-symbols/svg-300/sharp/backspace.svg'
import calendarToday from '@material-symbols/svg-300/sharp/calendar_today.svg'
import check from '@material-symbols/svg-300/sharp/check.svg'
import chevronLeft from '@material-symbols/svg-300/sharp/chevron_left.svg'
import chevronRight from '@material-symbols/svg-300/sharp/chevron_right.svg'
import close from '@material-symbols/svg-300/sharp/close.svg'
import deleteIcon from '@material-symbols/svg-300/sharp/delete.svg'
import deleteForever from '@material-symbols/svg-300/sharp/delete_forever.svg'
import editNote from '@material-symbols/svg-300/sharp/edit_note.svg'
import eventBusy from '@material-symbols/svg-300/sharp/event_busy.svg'
import editNoteFill from '@material-symbols/svg-300/sharp/edit_note-fill.svg'
import monitoring from '@material-symbols/svg-300/sharp/monitoring.svg'
import monitoringFill from '@material-symbols/svg-300/sharp/monitoring-fill.svg'
import notes from '@material-symbols/svg-300/sharp/notes.svg'
import payments from '@material-symbols/svg-300/sharp/payments.svg'
import paymentsFill from '@material-symbols/svg-300/sharp/payments-fill.svg'
import savings from '@material-symbols/svg-300/sharp/savings.svg'
import savingsFill from '@material-symbols/svg-300/sharp/savings-fill.svg'
import schedule from '@material-symbols/svg-300/sharp/schedule.svg'
import scheduleFill from '@material-symbols/svg-300/sharp/schedule-fill.svg'
import syncProblem from '@material-symbols/svg-300/sharp/sync_problem.svg'
import warning from '@material-symbols/svg-300/sharp/warning.svg'

const icons = {
  account_balance: accountBalance,
  add,
  add_chart: addChart,
  all_inclusive: allInclusive,
  backspace,
  calendar_today: calendarToday,
  check,
  chevron_left: chevronLeft,
  chevron_right: chevronRight,
  close,
  delete: deleteIcon,
  delete_forever: deleteForever,
  edit_note: editNote,
  event_busy: eventBusy,
  monitoring,
  notes,
  payments,
  savings,
  schedule,
  sync_problem: syncProblem,
  warning
}
const filledIcons = {
  account_balance: accountBalanceFill,
  all_inclusive: allInclusiveFill,
  edit_note: editNoteFill,
  monitoring: monitoringFill,
  payments: paymentsFill,
  savings: savingsFill,
  schedule: scheduleFill
}

export const Icon = ({ name, filled = false }) => (
  <img className="material-symbols-sharp" src={filled && filledIcons[name] || icons[name]} alt="" aria-hidden="true" />
)
