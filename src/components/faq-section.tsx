import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FAQSection() {
  const faqs = [
    {
      question: "Это реально работает? Мне правда платят?",
      answer:
        "Да, это реальный заработок. AdWatch работает по простой модели: рекламодатели платят за просмотры, и мы делим эту сумму пополам — 50% получаешь ты, 50% — платформа. Никаких скрытых условий.",
    },
    {
      question: "Сколько можно заработать?",
      answer:
        "Заработок зависит от количества просмотренной рекламы и стоимости объявлений. В среднем пользователи зарабатывают от 3 000 до 15 000 рублей в месяц при регулярном использовании. Чем больше смотришь — тем больше получаешь.",
    },
    {
      question: "Нужно ли вкладывать деньги?",
      answer:
        "Нет. Регистрация и использование AdWatch полностью бесплатны. Никаких взносов, депозитов или подписок. Ты просто смотришь рекламу и получаешь деньги.",
    },
    {
      question: "Как вывести заработанные деньги?",
      answer:
        "Выводить можно в любой момент на банковскую карту, телефон или электронный кошелёк. Минимальная сумма для вывода — 500 рублей. Средства поступают в течение нескольких минут.",
    },
    {
      question: "Можно ли совмещать с основной работой?",
      answer:
        "Абсолютно! AdWatch работает на телефоне и в браузере. Смотри рекламу в свободное время: утром, в перерывах, в транспорте. Это полностью гибкий дополнительный доход.",
    },
    {
      question: "Почему платформа отдаёт 50% пользователям?",
      answer:
        "Потому что именно пользователи создают ценность для рекламодателей. Рекламодатели платят за реальные просмотры живых людей — и было бы несправедливо не делиться этим доходом с теми, кто их обеспечивает.",
    },
  ]

  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron">Частые вопросы</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-space-mono">
            Отвечаем честно на всё, что вас интересует о платформе AdWatch.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-red-500/20 mb-4">
                <AccordionTrigger className="text-left text-lg font-semibold text-white hover:text-red-400 font-orbitron px-6 py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed px-6 pb-4 font-space-mono">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
