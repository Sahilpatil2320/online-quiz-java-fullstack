-- SQROCK Quiz - sample data (4 quizzes, 32 questions). Run ONCE on an empty database after schema.sql.
-- Generated content only; contains no passwords or users.
USE quiz_app;

START TRANSACTION;

INSERT INTO quizzes (title, description, subject, difficulty, duration_minutes, published, deleted)
VALUES ('Java Fundamentals', 'Core Java: syntax, OOP, strings, collections and exceptions.', 'Java', 'EASY', 10, 1, 0);
SET @quiz_id = LAST_INSERT_ID();
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which keyword is used to inherit a class in Java?', 'A class inherits another class with extends. implements is used for interfaces.', 'OOP', 1, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'implements', 0, 1), (@question_id, 'extends', 1, 2), (@question_id, 'inherits', 0, 3), (@question_id, 'super', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What is the default value of an int instance variable in Java?', 'Numeric instance variables default to 0; local variables have no default.', 'Basics', 2, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'null', 0, 1), (@question_id, '1', 0, 2), (@question_id, '0', 1, 3), (@question_id, 'undefined', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which of these is NOT a primitive data type in Java?', 'String is a class (reference type), not a primitive.', 'Basics', 3, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'boolean', 0, 1), (@question_id, 'char', 0, 2), (@question_id, 'String', 1, 3), (@question_id, 'double', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which collection does NOT allow duplicate elements?', 'A Set (such as HashSet) stores unique elements only.', 'Collections', 4, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'ArrayList', 0, 1), (@question_id, 'LinkedList', 0, 2), (@question_id, 'HashSet', 1, 3), (@question_id, 'Vector', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What does the ''final'' keyword on a variable mean?', 'A final variable can be assigned only once.', 'OOP', 5, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'It can be overridden', 0, 1), (@question_id, 'Its value cannot be changed after assignment', 1, 2), (@question_id, 'It is stored in the heap only', 0, 3), (@question_id, 'It belongs to the class', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which exception is thrown when dividing an integer by zero?', 'Integer division by zero throws ArithmeticException.', 'Exceptions', 6, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'NullPointerException', 0, 1), (@question_id, 'ArithmeticException', 1, 2), (@question_id, 'NumberFormatException', 0, 3), (@question_id, 'IOException', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which method is the entry point of a Java application?', 'The JVM starts execution at public static void main(String[] args).', 'Basics', 7, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'start()', 0, 1), (@question_id, 'run()', 0, 2), (@question_id, 'main()', 1, 3), (@question_id, 'init()', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What is the term for defining several methods with the same name but different parameters?', 'That is method overloading (compile-time polymorphism).', 'OOP', 8, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'Overriding', 0, 1), (@question_id, 'Overloading', 1, 2), (@question_id, 'Encapsulation', 0, 3), (@question_id, 'Abstraction', 0, 4);

INSERT INTO quizzes (title, description, subject, difficulty, duration_minutes, published, deleted)
VALUES ('SQL & Database Basics', 'Relational databases: queries, joins, keys and constraints.', 'SQL', 'MEDIUM', 12, 1, 0);
SET @quiz_id = LAST_INSERT_ID();
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which SQL statement is used to retrieve data from a table?', 'SELECT reads rows from one or more tables.', 'Queries', 1, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'GET', 0, 1), (@question_id, 'SELECT', 1, 2), (@question_id, 'FETCH', 0, 3), (@question_id, 'EXTRACT', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which constraint guarantees that every value in a column is unique and not NULL?', 'A primary key is unique and cannot be NULL.', 'Keys', 2, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'FOREIGN KEY', 0, 1), (@question_id, 'CHECK', 0, 2), (@question_id, 'PRIMARY KEY', 1, 3), (@question_id, 'DEFAULT', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which JOIN returns only rows that have matching values in both tables?', 'INNER JOIN keeps only matching rows.', 'Joins', 3, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'LEFT JOIN', 0, 1), (@question_id, 'INNER JOIN', 1, 2), (@question_id, 'FULL JOIN', 0, 3), (@question_id, 'CROSS JOIN', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which clause filters groups created by GROUP BY?', 'HAVING filters aggregated groups; WHERE filters rows before grouping.', 'Queries', 4, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'WHERE', 0, 1), (@question_id, 'ORDER BY', 0, 2), (@question_id, 'HAVING', 1, 3), (@question_id, 'LIMIT', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What does the ACID property ''Atomicity'' mean?', 'Either all operations of a transaction succeed or none do.', 'Transactions', 5, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'Data is encrypted', 0, 1), (@question_id, 'A transaction is all-or-nothing', 1, 2), (@question_id, 'Transactions run in parallel', 0, 3), (@question_id, 'Tables are indexed', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which command removes all rows from a table quickly but keeps its structure?', 'TRUNCATE TABLE empties the table; DROP TABLE removes the table itself.', 'DDL/DML', 6, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'DROP TABLE', 0, 1), (@question_id, 'DELETE TABLE', 0, 2), (@question_id, 'TRUNCATE TABLE', 1, 3), (@question_id, 'REMOVE TABLE', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What is the purpose of a FOREIGN KEY?', 'It enforces referential integrity between tables.', 'Keys', 7, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'Speed up sorting', 0, 1), (@question_id, 'Link rows to a parent table and keep references valid', 1, 2), (@question_id, 'Encrypt a column', 0, 3), (@question_id, 'Store large text', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which function returns the number of rows in a result?', 'COUNT(*) counts rows.', 'Queries', 8, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'SUM()', 0, 1), (@question_id, 'COUNT()', 1, 2), (@question_id, 'TOTAL()', 0, 3), (@question_id, 'LENGTH()', 0, 4);

INSERT INTO quizzes (title, description, subject, difficulty, duration_minutes, published, deleted)
VALUES ('Computer Fundamentals', 'Hardware, memory, operating systems, networks and number systems.', 'Computer Science', 'EASY', 10, 1, 0);
SET @quiz_id = LAST_INSERT_ID();
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What does CPU stand for?', 'CPU is the Central Processing Unit, the ''brain'' of the computer.', 'Hardware', 1, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'Central Processing Unit', 1, 1), (@question_id, 'Computer Personal Unit', 0, 2), (@question_id, 'Central Program Utility', 0, 3), (@question_id, 'Core Processing Usage', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which memory is volatile, losing its data when power is off?', 'RAM needs power to keep data.', 'Memory', 2, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'ROM', 0, 1), (@question_id, 'SSD', 0, 2), (@question_id, 'RAM', 1, 3), (@question_id, 'Hard disk', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'How many bits are in one byte?', '1 byte = 8 bits.', 'Number Systems', 3, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, '4', 0, 1), (@question_id, '8', 1, 2), (@question_id, '16', 0, 3), (@question_id, '32', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What is the binary representation of the decimal number 5?', '5 = 4 + 1 = 101 in binary.', 'Number Systems', 4, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, '100', 0, 1), (@question_id, '101', 1, 2), (@question_id, '110', 0, 3), (@question_id, '111', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which protocol is used to load web pages securely?', 'HTTPS is HTTP over TLS encryption.', 'Networking', 5, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'FTP', 0, 1), (@question_id, 'SMTP', 0, 2), (@question_id, 'HTTPS', 1, 3), (@question_id, 'SSH', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which software manages hardware and runs other programs?', 'The operating system manages hardware resources.', 'Operating Systems', 6, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'Compiler', 0, 1), (@question_id, 'Operating system', 1, 2), (@question_id, 'Browser', 0, 3), (@question_id, 'Database', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What does an IP address identify?', 'An IP address identifies a device (host) on a network.', 'Networking', 7, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'A website''s design', 0, 1), (@question_id, 'A device on a network', 1, 2), (@question_id, 'A user''s password', 0, 3), (@question_id, 'A file type', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Which of these is an input device?', 'A keyboard sends data into the computer.', 'Hardware', 8, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'Monitor', 0, 1), (@question_id, 'Printer', 0, 2), (@question_id, 'Keyboard', 1, 3), (@question_id, 'Speaker', 0, 4);

INSERT INTO quizzes (title, description, subject, difficulty, duration_minutes, published, deleted)
VALUES ('General Aptitude', 'Quantitative and logical reasoning practice.', 'Aptitude', 'MEDIUM', 15, 1, 0);
SET @quiz_id = LAST_INSERT_ID();
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What is 15% of 200?', '15/100 x 200 = 30.', 'Percentages', 1, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, '20', 0, 1), (@question_id, '25', 0, 2), (@question_id, '30', 1, 3), (@question_id, '35', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What comes next in the series 2, 4, 8, 16, ...?', 'Each term doubles: 16 x 2 = 32.', 'Series', 2, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, '24', 0, 1), (@question_id, '30', 0, 2), (@question_id, '32', 1, 3), (@question_id, '36', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'A train travels 120 km in 2 hours. What is its average speed?', 'Speed = distance / time = 120 / 2 = 60 km/h.', 'Speed & Distance', 3, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, '50 km/h', 0, 1), (@question_id, '60 km/h', 1, 2), (@question_id, '70 km/h', 0, 3), (@question_id, '80 km/h', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'If A is the brother of B, and B is the sister of C, how is A related to C?', 'A and C share B as a sibling, so A is C''s brother.', 'Reasoning', 4, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'Brother', 1, 1), (@question_id, 'Father', 0, 2), (@question_id, 'Cousin', 0, 3), (@question_id, 'Uncle', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What is the average of 10, 20, 30 and 40?', '(10+20+30+40) / 4 = 25.', 'Averages', 5, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, '20', 0, 1), (@question_id, '25', 1, 2), (@question_id, '30', 0, 3), (@question_id, '35', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'Find the odd one out: Apple, Banana, Carrot, Mango', 'Carrot is a vegetable; the others are fruits.', 'Reasoning', 6, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, 'Apple', 0, 1), (@question_id, 'Banana', 0, 2), (@question_id, 'Carrot', 1, 3), (@question_id, 'Mango', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'If 5 pens cost 50 rupees, how much do 8 pens cost?', 'One pen costs 10, so 8 pens cost 80.', 'Ratio & Proportion', 7, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, '70', 0, 1), (@question_id, '75', 0, 2), (@question_id, '80', 1, 3), (@question_id, '85', 0, 4);
INSERT INTO questions (quiz_id, question_text, explanation, topic, question_order, deleted) VALUES (@quiz_id, 'What is the square root of 144?', '12 x 12 = 144.', 'Numbers', 8, 0);
SET @question_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, option_text, is_correct, option_order) VALUES (@question_id, '10', 0, 1), (@question_id, '11', 0, 2), (@question_id, '12', 1, 3), (@question_id, '14', 0, 4);

COMMIT;
