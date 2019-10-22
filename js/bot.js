class Bot {

    constructor(text, base) {
      this.text = text;
      this.base = base;
    }

    parseText() {
        this.separators = "/,| /";
        this.income = this.text.split(separators);
        return this.income;
    }
  
  }

let bot = new Bot("Привет, меня интересует ваш товар",);
console.log(bot.parseText());