import account from './it/account.json'
import characters from './it/characters.json'
import quiz from './it/quiz.json'
import stats from './it/stats.json'
import ui from './it/ui.json'

// `quiz` esiste sia in ui.json (testi dell'interfaccia) sia in quiz.json (domande): vanno uniti, non sovrascritti.
export default { ...ui, ...account, ...stats, characters, quiz: { ...ui.quiz, ...quiz } }
