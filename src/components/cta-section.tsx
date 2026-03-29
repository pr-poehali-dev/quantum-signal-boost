import { Button } from "@/components/ui/button"

interface CTASectionProps {
  onStartEarning?: () => void
}

export function CTASection({ onStartEarning }: CTASectionProps) {
  return (
    <section className="py-24 px-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
      <div className="max-w-4xl mx-auto text-center">
        <div className="slide-up">
          <h2 className="text-5xl font-bold text-foreground mb-6 font-sans text-balance">
            Начни зарабатывать прямо сейчас
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
            Тысячи людей уже получают деньги за просмотр рекламы. Регистрация бесплатна — без вложений,
            без рисков. Просто смотри и зарабатывай 50% с каждого просмотра.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={onStartEarning}
              className="bg-primary text-primary-foreground hover:bg-primary/90 pulse-button text-lg px-8 py-4"
            >
              Зарегистрироваться бесплатно
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-8 py-4 bg-transparent"
            >
              Узнать больше
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            🔒 Без вложений · Вывод от 50 ₽ · Работает на iOS, Android и браузере
          </p>
        </div>
      </div>
    </section>
  )
}