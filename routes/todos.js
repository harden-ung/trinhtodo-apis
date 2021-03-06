const express = require('express')
const router = express.Router()

const auth = require('../middleware/auth')
const { check, validationResult } = require('express-validator')
const Todo = require('../models/Todo')

// @route   GET api/todos
// @desc    Get all todos
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const todos = await Todo.find()
      // @ts-ignore
      .or([{ user: req.user.id }, { subUsers: req.user.id }])
      .populate('subUsers', 'firstName lastName username')
      .populate('user', 'firstName lastName username')
      .sort({
        date: -1
      })
    res.json(todos)
  } catch (err) {
    res.status(500).send('Server Error')
    // res.status(500).send(JSON.stringify(err))
  }
})

// @route   GET api/todos/id
// @desc    Get one todo
// @access  Private
// not in use
router.get('/:id', auth, async (req, res) => {
  try {
    const todos = await Todo.find().or([
      // @ts-ignore
      { user: req.user.id },
      // @ts-ignore
      { subUsers: req.user.id }
    ])
    const todo = todos.find(todo => todo._id === req.params.id)
    res.json(todo)
  } catch (err) {
    res.status(500).send('Server Error')
  }
})

// @route   POST api/todos
// @desc    Add new todo
// @access  Private
router.post(
  '/',
  [
    auth,
    check('header', 'Header is required')
      .not()
      .isEmpty(),
    check('purpose', 'Purpose is required')
      .not()
      .isEmpty(),
    check('createDate', 'createDate is required')
      .not()
      .isEmpty(),
    check('isCompleted', 'isCompleted is required')
      .not()
      .isEmpty(),
    check('mustBeCompleted', 'mustBeCompleted is required')
      .not()
      .isEmpty(),
    check('isImportant', 'isImportant is required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      header,
      description,
      isCompleted,
      purpose,
      createDate,
      mustBeCompleted,
      isImportant,
      subUsers
    } = req.body

    try {
      const newTodo = new Todo({
        header,
        description,
        isCompleted,
        purpose,
        createDate,
        mustBeCompleted,
        isImportant,
        subUsers,

        user: req.user.id
      })
      const todo = await newTodo.save()
      res.json(todo)
    } catch (error) {
      res.status(500).send('Server Error')
    }
  }
)

// @route   PUT api/todos/:id
// @desc    Update todo
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const {
    header,
    description,
    isCompleted,
    purpose,
    createDate,
    mustBeCompleted,
    subUsers,
    isImportant
  } = req.body

  const todoFields = {}
  if (header) todoFields.header = header
  if (description) todoFields.description = description
  if (typeof isCompleted !== 'undefined') todoFields.isCompleted = isCompleted
  if (purpose) todoFields.purpose = purpose
  if (createDate) todoFields.createDate = createDate
  if (subUsers) todoFields.subUsers = subUsers
  if (typeof mustBeCompleted !== 'undefined')
    todoFields.mustBeCompleted = mustBeCompleted
  if (typeof isImportant !== 'undefined') todoFields.isImportant = isImportant

  try {
    let todo = await Todo.findById(req.params.id)
    if (!todo) return res.status(404).json({ msg: 'Todo not found' })

    // Make sure owns todo
    if (
      todo.user.toString() !== req.user.id &&
      todo.subUsers.every(user => user.toString() !== req.user.id)
    ) {
      return res.status(401).json({ msg: 'Not authorized' })
    }

    todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: todoFields },
      { new: true }
    )

    res.json(todo)
  } catch (err) {
    console.error(err.message)

    res.status(500).send('Server Error')
  }
})

router.patch('/:id', auth, async (req, res) => {
  const {
    header,
    description,
    isCompleted,
    purpose,
    createDate,
    mustBeCompleted,
    isImportant,
    subUsers
  } = req.body

  const todoFields = {}
  if (header) todoFields.header = header
  if (description) todoFields.description = description
  if (typeof isCompleted !== 'undefined') todoFields.isCompleted = isCompleted
  if (purpose) todoFields.purpose = purpose
  if (createDate) todoFields.createDate = createDate
  if (subUsers) todoFields.subUsers = subUsers
  if (typeof mustBeCompleted !== 'undefined')
    todoFields.mustBeCompleted = mustBeCompleted
  if (typeof isImportant !== 'undefined') todoFields.isImportant = isImportant

  try {
    let todo = await Todo.findById(req.params.id)
    if (!todo) return res.status(404).json({ msg: 'Todo not found' })

    // Make sure owns todo
    if (
      todo.user.toString() !== req.user.id &&
      todo.subUsers.every(user => user.toString() !== req.user.id)
    ) {
      return res.status(401).json({ msg: 'Not authorized' })
    }

    todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: todoFields },
      { new: true }
    )

    res.json(todo)
  } catch (err) {
    console.error(err.message)

    res.status(500).send('Server Error')
  }
})

// @route   DELETE api/todos
// @desc    DELETE a todo
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let todo = await Todo.findById(req.params.id)
    if (!todo) return res.status(404).json({ msg: 'Todo not found' })

    // Make sure owns todo

    if (
      todo.user.toString() !== req.user.id &&
      todo.subUsers.every(user => user.toString() !== req.user.id)
    ) {
      return res.status(401).json({ msg: 'Not authorized' })
    }

    await Todo.findByIdAndRemove(req.params.id)
    res.json('Todo removed')
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
