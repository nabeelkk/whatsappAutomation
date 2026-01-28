const Contact = require('../models/Contact');
const csv = require('csv-parser');
const fs = require('fs');

exports.getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, tags, status } = req.query;
    const query = { userId: req.userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    if (status) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Contact.countDocuments(query);

    res.json({
      contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createContact = async (req, res) => {
  try {
    const contact = new Contact({ ...req.body, userId: req.userId });
    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.importContacts = async (req, res) => {
  try {
    const contacts = [];
    const filePath = req.file.path;
    console.log('Importing contacts from file:', filePath);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        contacts.push({
          userId: req.userId,
          phoneNumber: row.phoneNumber || row.phone,
          name: row.name,
          email: row.email,
          tags: row.tags ? row.tags.split(',') : [],
          source: 'import',
          optIn: true
        });
      })
      .on('end', async () => {
        try {
          const result = await Contact.insertMany(contacts, { ordered: false });
          fs.unlinkSync(filePath);
          res.json({ imported: result.length, total: contacts.length });
        } catch (error) {
          fs.unlinkSync(filePath);
          res.status(500).json({ error: error.message });
        }
      });
      console.log('Started reading file for import:', filePath);
      console.log('Number of contacts to import:', contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bulkAction = async (req, res) => {
  try {
    const { action, contactIds, data } = req.body;

    switch (action) {
      case 'addTags':
        await Contact.updateMany(
          { _id: { $in: contactIds }, userId: req.userId },
          { $addToSet: { tags: { $each: data.tags } } }
        );
        break;
      case 'removeTags':
        await Contact.updateMany(
          { _id: { $in: contactIds }, userId: req.userId },
          { $pull: { tags: { $in: data.tags } } }
        );
        break;
      case 'delete':
        await Contact.deleteMany({ _id: { $in: contactIds }, userId: req.userId });
        break;
      case 'optOut':
        await Contact.updateMany(
          { _id: { $in: contactIds }, userId: req.userId },
          { optIn: false, optOutDate: Date.now() }
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ message: 'Bulk action completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
