const {divideMessagesForRendering, mergeOldMessages} = require("../index")

describe('divideMessagesForRendering', () => {


    test('пустой массив сообщений', () => {
        const apiResponse = { result: { messages: [] } };
        const result = divideMessagesForRendering(apiResponse);

        expect(result).toEqual([]);
    });


    test('группировка по дате и автору (1 дата группа)', () => {
        const apiResponse = {
            "error": "",
            "result": {
                "messages": [
                    {
                        "author_uid": 5,
                        "text": "Привет! Как дела?",
                        "created": "2025-01-12 06:00:00",

                    },
                    {

                        "author_uid": 5,
                        "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                        "created": "2025-01-12 06:10:00",

                    },
                    {

                        "author_uid": 5,
                        "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                        "created": "2025-01-12 06:15:00",


                    },
                    {
                        "author_uid": 423,
                        "text": "Конечно, спрашивай.",
                        "created": "2025-01-12 12:51:00",

                    }
                ]
            }
        }

        const result = divideMessagesForRendering(apiResponse);

        expect(result).toEqual([
            { type: 'day', date: '2025-01-12' },

            [
                {
                    "author_uid": 5,
                    "text": "Привет! Как дела?",
                    "created": "2025-01-12 06:00:00",

                },
                {
                    "author_uid": 5,
                    "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                    "created": "2025-01-12 06:10:00",

                },
                {
                    "author_uid": 5,
                    "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                    "created": "2025-01-12 06:15:00",

                }
            ],
            [
                {
                    "author_uid": 423,
                    "text": "Конечно, спрашивай.",
                    "created": "2025-01-12 12:51:00",

                }
            ],


        ]);
    });


    test('большой массив сообщений, много дата-групп', () => {
        const apiResponse = { result: {
                "messages": [
                    {
                        "author_uid": 5,
                        "text": "Привет! Как дела?",
                        "created": "2025-01-12 06:00:00"
                    },
                    {
                        "author_uid": 5,
                        "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                        "created": "2025-01-12 06:10:00"
                    },
                    {
                        "author_uid": 5,
                        "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                        "created": "2025-01-12 06:15:00"
                    },
                    {
                        "author_uid": 423,
                        "text": "Конечно, спрашивай.",
                        "created": "2025-01-12 12:51:00"
                    },
                    {
                        "author_uid": 423,
                        "text": "Когда вы сможете доставить? Нужно к понедельнику.",
                        "created": "2025-01-13 06:20:00"
                    },
                    {
                        "author_uid": 423,
                        "text": "Да, мы сможем доставить в срок.Уточните адрес.",
                        "created": "2025-01-13 06:30:00"
                    },
                    {
                        "author_uid": 5,
                        "text": "Отправлю вам в личные сообщения.",
                        "created": "2025-01-14 06:40:00"
                    },
                    {
                        "author_uid": 5,
                        "text": "Хорошо, жду!",
                        "created": "2025-01-15 10:10:00"
                    },
                    {
                        "author_uid": 5,
                        "text": "Спасибо за оперативность!",
                        "created": "2025-01-15 12:00:00"
                    },
                    {
                        "author_uid": 423,
                        "text": "Пожалуйста, обращайтесь!",
                        "created": "2025-01-15 13:23:00"
                    }
                ]
            } };
        const result = divideMessagesForRendering(apiResponse);

        expect(result).toEqual([
            { type: 'day', date: '2025-01-12' },
            [
                {
                    "author_uid": 5,
                    "text": "Привет! Как дела?",
                    "created": "2025-01-12 06:00:00"
                },
                {
                    "author_uid": 5,
                    "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                    "created": "2025-01-12 06:10:00"
                },
                {
                    "author_uid": 5,
                    "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                    "created": "2025-01-12 06:15:00"
                }
            ],
            [
                {
                    "author_uid": 423,
                    "text": "Конечно, спрашивай.",
                    "created": "2025-01-12 12:51:00"
                }
            ],
            { type: 'day', date: '2025-01-13' },
            [{
                "author_uid": 423,
                "text": "Когда вы сможете доставить? Нужно к понедельнику.",
                "created": "2025-01-13 06:20:00"
            },
            {
                "author_uid": 423,
                "text": "Да, мы сможем доставить в срок.Уточните адрес.",
                "created": "2025-01-13 06:30:00"
            }],
            { type: 'day', date: '2025-01-14' },
            [
                {
                    "author_uid": 5,
                    "text": "Отправлю вам в личные сообщения.",
                    "created": "2025-01-14 06:40:00"
                }
            ],
            { type: 'day', date: '2025-01-15' },
            [{
                "author_uid": 5,
                "text": "Хорошо, жду!",
                "created": "2025-01-15 10:10:00"
            },
            {
                "author_uid": 5,
                "text": "Спасибо за оперативность!",
                "created": "2025-01-15 12:00:00"
            }],
            [{
                "author_uid": 423,
                "text": "Пожалуйста, обращайтесь!",
                "created": "2025-01-15 13:23:00"
            }]

        ]);
    });

});


describe('mergeOldMessages', () => {

    test('пустой массив добавляемых старых сообщений', () => {
        const newDirtyResponse = { result: { messages: [] } };
        const oldCleanMessages = [
            { type: 'day', date: '2025-01-12' },
            [
                {
                    "author_uid": 5,
                    "text": "Привет! Как дела?",
                    "created": "2025-01-12 06:00:00"
                },
                {
                    "author_uid": 5,
                    "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                    "created": "2025-01-12 06:10:00"
                },
                {
                    "author_uid": 5,
                    "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                    "created": "2025-01-12 06:15:00"
                }
            ],
            [
                {
                    "author_uid": 423,
                    "text": "Конечно, спрашивай.",
                    "created": "2025-01-12 12:51:00"
                }
            ],
            { type: 'day', date: '2025-01-13' },
            [{
                "author_uid": 423,
                "text": "Когда вы сможете доставить? Нужно к понедельнику.",
                "created": "2025-01-13 06:20:00"
            },
                {
                    "author_uid": 423,
                    "text": "Да, мы сможем доставить в срок.Уточните адрес.",
                    "created": "2025-01-13 06:30:00"
                }],
            { type: 'day', date: '2025-01-14' },
            [
                {
                    "author_uid": 5,
                    "text": "Отправлю вам в личные сообщения.",
                    "created": "2025-01-14 06:40:00"
                }
            ],
            { type: 'day', date: '2025-01-15' },
            [{
                "author_uid": 5,
                "text": "Хорошо, жду!",
                "created": "2025-01-15 10:10:00"
            },
                {
                    "author_uid": 5,
                    "text": "Спасибо за оперативность!",
                    "created": "2025-01-15 12:00:00"
                }],
            [{
                "author_uid": 423,
                "text": "Пожалуйста, обращайтесь!",
                "created": "2025-01-15 13:23:00"
            }]
        ];

        const result = mergeOldMessages(newDirtyResponse,oldCleanMessages);

        expect(result).toEqual(oldCleanMessages);
    });

    test('пустой массив изначально очищенных сообщений', () => {
        const newDirtyResponse = {
            "error": "",
            "result": {
                "messages": [
                    {
                        "author_uid": 5,
                        "text": "Привет! Как дела?",
                        "created": "2025-01-12 06:00:00",

                    },
                    {

                        "author_uid": 5,
                        "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                        "created": "2025-01-12 06:10:00",

                    },
                    {

                        "author_uid": 5,
                        "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                        "created": "2025-01-12 06:15:00",


                    },
                    {
                        "author_uid": 423,
                        "text": "Конечно, спрашивай.",
                        "created": "2025-01-12 12:51:00",

                    }
                ]
            }
        };
        const oldCleanMessages = [];

        const result = mergeOldMessages(newDirtyResponse,oldCleanMessages);

        expect(result).toEqual([
            { type: 'day', date: '2025-01-12' },

            [
                {
                    "author_uid": 5,
                    "text": "Привет! Как дела?",
                    "created": "2025-01-12 06:00:00",

                },
                {
                    "author_uid": 5,
                    "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                    "created": "2025-01-12 06:10:00",

                },
                {
                    "author_uid": 5,
                    "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                    "created": "2025-01-12 06:15:00",

                }
            ],
            [
                {
                    "author_uid": 423,
                    "text": "Конечно, спрашивай.",
                    "created": "2025-01-12 12:51:00",

                }
            ],


        ]);
    });

    test('оба массива пустые (если такое возможно)', () => {
        const newDirtyResponse = { result: { messages: [] } };
        const oldCleanMessages = [];

        const result = mergeOldMessages(newDirtyResponse,oldCleanMessages);

        expect(result).toEqual([]);
    });


    test('первые сообщения из изначально очищенных имеют другую дата-группу', () => {
        const newDirtyResponse = {
            result: {
                messages: [
                    {
                        "author_uid": 5,
                        "text": "Старое сообщение 1",
                        "created": "2025-01-11 16:00:00"
                    },
                    {
                        "author_uid": 423,
                        "text": "Старое сообщение 2",
                        "created": "2025-01-11 17:20:00"
                    }
                ]
            }
        };

        const oldCleanMessages = [
            { type: 'day', date: '2025-01-12' },
            [
                {
                    "author_uid": 5,
                    "text": "Привет! Как дела?",
                    "created": "2025-01-12 06:00:00"
                },
                {
                    "author_uid": 5,
                    "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                    "created": "2025-01-12 06:10:00"
                },
                {
                    "author_uid": 5,
                    "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                    "created": "2025-01-12 06:15:00"
                }
            ],
            [
                {
                    "author_uid": 423,
                    "text": "Конечно, спрашивай.",
                    "created": "2025-01-12 12:51:00"
                }
            ],
            { type: 'day', date: '2025-01-13' },
            [{
                "author_uid": 423,
                "text": "Когда вы сможете доставить? Нужно к понедельнику.",
                "created": "2025-01-13 06:20:00"
            },
                {
                    "author_uid": 423,
                    "text": "Да, мы сможем доставить в срок.Уточните адрес.",
                    "created": "2025-01-13 06:30:00"
                }],
            { type: 'day', date: '2025-01-14' },
            [
                {
                    "author_uid": 5,
                    "text": "Отправлю вам в личные сообщения.",
                    "created": "2025-01-14 06:40:00"
                }
            ],
            { type: 'day', date: '2025-01-15' },
            [{
                "author_uid": 5,
                "text": "Хорошо, жду!",
                "created": "2025-01-15 10:10:00"
            },
                {
                    "author_uid": 5,
                    "text": "Спасибо за оперативность!",
                    "created": "2025-01-15 12:00:00"
                }],
            [{
                "author_uid": 423,
                "text": "Пожалуйста, обращайтесь!",
                "created": "2025-01-15 13:23:00"
            }]
        ];

        const result = mergeOldMessages(newDirtyResponse, oldCleanMessages);

        expect(result).toEqual(
            [
                { type: 'day', date: '2025-01-11' },
                [
                    {
                        "author_uid": 5,
                        "text": "Старое сообщение 1",
                        "created": "2025-01-11 16:00:00"
                    }
                ],
                [
                    {
                        "author_uid": 423,
                        "text": "Старое сообщение 2",
                        "created": "2025-01-11 17:20:00"
                    }
                ],
                { type: 'day', date: '2025-01-12' },
                [
                    {
                        "author_uid": 5,
                        "text": "Привет! Как дела?",
                        "created": "2025-01-12 06:00:00"
                    },
                    {
                        "author_uid": 5,
                        "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                        "created": "2025-01-12 06:10:00"
                    },
                    {
                        "author_uid": 5,
                        "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                        "created": "2025-01-12 06:15:00"
                    }
                ],
                [
                    {
                        "author_uid": 423,
                        "text": "Конечно, спрашивай.",
                        "created": "2025-01-12 12:51:00"
                    }
                ],
                { type: 'day', date: '2025-01-13' },
                [{
                    "author_uid": 423,
                    "text": "Когда вы сможете доставить? Нужно к понедельнику.",
                    "created": "2025-01-13 06:20:00"
                },
                    {
                        "author_uid": 423,
                        "text": "Да, мы сможем доставить в срок.Уточните адрес.",
                        "created": "2025-01-13 06:30:00"
                    }],
                { type: 'day', date: '2025-01-14' },
                [
                    {
                        "author_uid": 5,
                        "text": "Отправлю вам в личные сообщения.",
                        "created": "2025-01-14 06:40:00"
                    }
                ],
                { type: 'day', date: '2025-01-15' },
                [{
                    "author_uid": 5,
                    "text": "Хорошо, жду!",
                    "created": "2025-01-15 10:10:00"
                },
                    {
                        "author_uid": 5,
                        "text": "Спасибо за оперативность!",
                        "created": "2025-01-15 12:00:00"
                    }],
                [{
                    "author_uid": 423,
                    "text": "Пожалуйста, обращайтесь!",
                    "created": "2025-01-15 13:23:00"
                }]
            ]
        );
    });

    test('первые сообщения из изначально очищенных имеют такую же дата-группу', () => {
        const newDirtyResponse = {
            result: {
                messages: [
                    {
                        "author_uid": 5,
                        "text": "Старое сообщение 1",
                        "created": "2025-01-12 05:00:00"
                    },
                    {
                        "author_uid": 423,
                        "text": "Старое сообщение 2",
                        "created": "2025-01-12 05:30:00"
                    }
                ]
            }
        };

        const oldCleanMessages = [
            { type: 'day', date: '2025-01-12' },
            [
                {
                    "author_uid": 5,
                    "text": "Привет! Как дела?",
                    "created": "2025-01-12 06:00:00"
                },
                {
                    "author_uid": 5,
                    "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                    "created": "2025-01-12 06:10:00"
                },
                {
                    "author_uid": 5,
                    "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                    "created": "2025-01-12 06:15:00"
                }
            ],
            [
                {
                    "author_uid": 423,
                    "text": "Конечно, спрашивай.",
                    "created": "2025-01-12 12:51:00"
                }
            ],
            { type: 'day', date: '2025-01-13' },
            [{
                "author_uid": 423,
                "text": "Когда вы сможете доставить? Нужно к понедельнику.",
                "created": "2025-01-13 06:20:00"
            },
                {
                    "author_uid": 423,
                    "text": "Да, мы сможем доставить в срок.Уточните адрес.",
                    "created": "2025-01-13 06:30:00"
                }],
            { type: 'day', date: '2025-01-14' },
            [
                {
                    "author_uid": 5,
                    "text": "Отправлю вам в личные сообщения.",
                    "created": "2025-01-14 06:40:00"
                }
            ],
            { type: 'day', date: '2025-01-15' },
            [{
                "author_uid": 5,
                "text": "Хорошо, жду!",
                "created": "2025-01-15 10:10:00"
            },
                {
                    "author_uid": 5,
                    "text": "Спасибо за оперативность!",
                    "created": "2025-01-15 12:00:00"
                }],
            [{
                "author_uid": 423,
                "text": "Пожалуйста, обращайтесь!",
                "created": "2025-01-15 13:23:00"
            }]
        ];

        const result = mergeOldMessages(newDirtyResponse, oldCleanMessages);

        expect(result).toEqual(
            [

                { type: 'day', date: '2025-01-12' },
                [
                    {
                        "author_uid": 5,
                        "text": "Старое сообщение 1",
                        "created": "2025-01-12 05:00:00"
                    }
                ],
                [
                    {
                        "author_uid": 423,
                        "text": "Старое сообщение 2",
                        "created": "2025-01-12 05:30:00"
                    }
                ],
                [
                    {
                        "author_uid": 5,
                        "text": "Привет! Как дела?",
                        "created": "2025-01-12 06:00:00"
                    },
                    {
                        "author_uid": 5,
                        "text": "Привет! Всё отлично, спасибо. Как у тебя?",
                        "created": "2025-01-12 06:10:00"
                    },
                    {
                        "author_uid": 5,
                        "text": "Тоже хорошо! Слушай, у меня вопрос по заказу.",
                        "created": "2025-01-12 06:15:00"
                    }
                ],
                [
                    {
                        "author_uid": 423,
                        "text": "Конечно, спрашивай.",
                        "created": "2025-01-12 12:51:00"
                    }
                ],
                { type: 'day', date: '2025-01-13' },
                [{
                    "author_uid": 423,
                    "text": "Когда вы сможете доставить? Нужно к понедельнику.",
                    "created": "2025-01-13 06:20:00"
                },
                    {
                        "author_uid": 423,
                        "text": "Да, мы сможем доставить в срок.Уточните адрес.",
                        "created": "2025-01-13 06:30:00"
                    }],
                { type: 'day', date: '2025-01-14' },
                [
                    {
                        "author_uid": 5,
                        "text": "Отправлю вам в личные сообщения.",
                        "created": "2025-01-14 06:40:00"
                    }
                ],
                { type: 'day', date: '2025-01-15' },
                [{
                    "author_uid": 5,
                    "text": "Хорошо, жду!",
                    "created": "2025-01-15 10:10:00"
                },
                    {
                        "author_uid": 5,
                        "text": "Спасибо за оперативность!",
                        "created": "2025-01-15 12:00:00"
                    }],
                [{
                    "author_uid": 423,
                    "text": "Пожалуйста, обращайтесь!",
                    "created": "2025-01-15 13:23:00"
                }]
            ]
        );
    });
});