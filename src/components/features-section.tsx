import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    title: "50% прибыли — тебе",
    description: "Каждый просмотр рекламы приносит реальные деньги. Половина всей прибыли платформы автоматически зачисляется на твой счёт.",
    icon: "money",
    badge: "Главное",
  },
  {
    title: "Мгновенные выплаты",
    description: "Накопил — вывел. Без задержек, без скрытых комиссий. Деньги поступают на карту или кошелёк в течение нескольких минут.",
    icon: "zap",
    badge: "Быстро",
  },
  {
    title: "Реклама под тебя",
    description: "Умный алгоритм подбирает только релевантные объявления. Смотри интересное и зарабатывай больше — без лишнего спама.",
    icon: "target",
    badge: "Умный",
  },
  {
    title: "Прозрачная статистика",
    description: "Видишь каждый рубль: сколько просмотрено, сколько заработано, сколько выведено. Полный контроль над своим доходом.",
    icon: "chart",
    badge: "Честно",
  },
  {
    title: "Без вложений",
    description: "Регистрация и использование — бесплатно. Никаких взносов и инвестиций. Просто смотри и получай деньги.",
    icon: "free",
    badge: "0 руб.",
  },
  {
    title: "Работает везде",
    description: "Приложение доступно на iOS, Android и в браузере. Зарабатывай в любое время — дома, в пути, в очереди.",
    icon: "globe",
    badge: "Мобильно",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4 font-sans">Почему AdWatch?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Самый честный способ зарабатывать онлайн — без вложений, без обмана
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glow-border hover:shadow-lg transition-all duration-300 slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">
                    {feature.icon === "money" && "💰"}
                    {feature.icon === "zap" && "⚡"}
                    {feature.icon === "target" && "🎯"}
                    {feature.icon === "chart" && "📊"}
                    {feature.icon === "free" && "🆓"}
                    {feature.icon === "globe" && "🌍"}
                  </span>
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-card-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
