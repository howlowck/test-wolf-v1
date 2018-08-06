const { wolfMiddleware, getMessages } = require('botbuilder-wolf')
// Packages are installed for you
const { BotFrameworkAdapter, MemoryStorage, ConversationState } = require('botbuilder')
const restify = require('restify')
const abilities = require('./alarmBot/abilities')
const nlp = require('./alarmBot/nlp')

// Create server
let server = restify.createServer()
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`${server.name} listening to ${server.url}`)
})

// Create adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
})

// Add conversation state middleware
const conversationState = new ConversationState(new MemoryStorage())
adapter.use(conversationState)
adapter.use(...wolfMiddleware(
  conversationState,
  (context) => nlp(context.activity.text),
  abilities,
  'listAbility',
  {enabled: false} // enable or disable devtool
))

server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    try {
      if (context.activity.type !== 'message') {
        return
      }
      const messages = getMessages(context) // retrieve output messages from Wolf
      await context.sendActivities(messages.messageActivityArray) // send messages to user
    } catch (err) {
      console.error(err.stack)
    }
  })
})
