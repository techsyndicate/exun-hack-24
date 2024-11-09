require('dotenv').config();
const User = require('../schemas/userSchema')
const Discovery = require('../schemas/discoverySchema')
const FormData = require('form-data');
const fetch = require('node-fetch')
const ImageKit = require("imagekit");

const router = require('express').Router()

router.get('/', async (req,res) => {
    const discoveries = await Discovery.find()
    res.render('discoveries', {user:req.user, discoveries})
})

router.post('/uploadAvatar', async (req,res) => {
    const imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });    
    const {base64Image} = req.body;
    try {
        const upload = await imagekit.upload({
            file: base64Image,
            fileName: `avatar-${Date.now()}.jpg`,
            folder: "/avatars"
        });

        if (upload.url) {
            await User.findOneAndUpdate(
                { _id: req.user._id },
                { $set: { avatar: upload.url } }
            );
            res.redirect('/discoveries');
        } else {
            throw new Error('Upload failed');
        }

    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/addDiscovery', async (req,res) => {
    const imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
    const {title, description, important, imagekimkc} = req.body
    let imageUrl = '';
    if (imagekimkc) {
        try {
            const upload = await imagekit.upload({
                file: imagekimkc,
                fileName: `discovery-${Date.now()}.jpg`,
                folder: "/discoveries"
            });
            if (upload.url) {
                console.log('this is upload url', upload.url)
                imageUrl = upload.url
            } else {
                res.send('marr gya')
            }
            
        } catch (error) {
            console.error('Error uploading image:', error);
            res.status(500).json({ error: error.message });
        }
    }
    let avatar = req.user.avatar
    if (!req.user.avatar) {
        avatar = '/avatar.png'
    }
    const newDiscovery = new Discovery({
        userId: req.user.id,
        title: title,
        description: description,
        important: important == "true",
        author: req.user.fname + ' ' + req.user.lname,
        role: req.user.role,
        avatar: avatar,
        image: imageUrl
    })
    await newDiscovery.save()
    res.redirect(`/discoveries/${newDiscovery._id}`)
})

router.get('/map', (req, res) => {
    res.render('map')
})

router.get('/:id', async (req,res) => {
    try {
        const discovery = await Discovery.findOne({_id:req.params.id})
        res.render('discovery', {user:req.user, discovery})       
    } catch (error) {
        console.log(error)
        res.send('something went wrong. please try again.')
    }
})

router.post('/delete', async (req,res) => {
    await Discovery.deleteOne({_id:req.body.id})
    console.log('hava me udd gya')
    return res.json({message:'Deleted', success: true})
})

module.exports = router