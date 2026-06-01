## Instrução: adicionar `cartTTL` ao seu `config.js`

Adicione a propriedade abaixo no objeto principal do seu `CONFIG`.
Ela controla o tempo máximo (em milissegundos) que o carrinho fica salvo
sem interação. Após esse período, ele é limpo automaticamente na próxima visita.

```js
// Tempo de vida do carrinho: 4 horas (em milissegundos)
// Altere o valor conforme necessário:
//   1h = 1 * 60 * 60 * 1000
//   2h = 2 * 60 * 60 * 1000
//   8h = 8 * 60 * 60 * 1000
cartTTL: 4 * 60 * 60 * 1000,
```

### Exemplo de como o CONFIG.js deve ficar:

```js
const CONFIG = {
  // ... suas propriedades existentes ...
  contato: { ... },
  horarios: [ ... ],

  // ← adicionar aqui
  cartTTL: 4 * 60 * 60 * 1000,
};
```

> Se a propriedade não for adicionada, o módulo Cart usa 4h como padrão
> automaticamente — então o site continua funcionando sem ela.
