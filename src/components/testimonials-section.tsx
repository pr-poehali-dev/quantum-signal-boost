import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Алексей М.",
    role: "Пользователь AdWatch, Москва",
    avatar: "/placeholder-user.jpg",
    content:
      "Уже вывел больше 8 000 рублей за два месяца. Смотрю рекламу по утрам за кофе — деньги капают сами. Честная платформа, всё прозрачно.",
  },
  {
    name: "Ирина К.",
    role: "Пользователь AdWatch, Санкт-Петербург",
    avatar: "/professional-woman-scientist.png",
    content:
      "Сначала не верила, но попробовала — и правда платят. Вывела первые деньги через неделю. Главное — никаких вложений не просят.",
  },
  {
    name: "Дмитрий Р.",
    role: "Пользователь AdWatch, Екатеринбург",
    avatar: "/cybersecurity-expert-man.jpg",
    content:
      "Удобно, что работает на телефоне. Смотрю рекламу в перерывах на работе. Пассивный доход — это реально, когда платят честно.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 px-6 bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-card-foreground mb-4 font-sans">Реальные отзывы</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Тысячи людей уже зарабатывают на AdWatch каждый день
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="glow-border slide-up" style={{ animationDelay: `${index * 0.15}s` }}>
              <CardContent className="p-6">
                <p className="text-card-foreground mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-primary">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
