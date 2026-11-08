import account from './en/account.json'
import characters from './en/characters.json'
import quiz from './en/quiz.json'
import stats from './en/stats.json'
import ui from './en/ui.json'

// `quiz` exists both in ui.json (interface text) and in quiz.json (questions): they must be merged, not overwritten.
export default { ...ui, ...account, ...stats, characters, quiz: { ...ui.quiz, ...quiz } }
