const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
    Sauce.find().then(
      (sauces) => {
        res.status(200).json(sauces);
      }
    ).catch(
      (error) => {
        res.status(400).json({ error: error });
      }
    );
  };

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({
        _id: req.params.id
    }).then(
        (sauce) => {
        res.status(200).json(sauce);
        }
    ).catch(
        (error) => {
        res.status(404).json({ error: error });
        }
    );
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });

    sauce.save()
    .then(() => { res.status(201).json({message: 'Sauce enregistrée !'})})
    .catch(error => { res.status(400).json( { error })})
};

exports.manageLikes = (req, res, next) => {
    const userId = req.auth.userId;
    if (req.body.like == 1) {
        Sauce.findOne({_id : req.params.id})
            .then((sauce) => {
                const usersLikedIds = sauce.usersLiked;
                if (!usersLikedIds.find( (el) => el === userId )) {
                let likeNumber = sauce.likes;
                likeNumber++;
                let newUsersLiked = sauce.usersLiked;
                newUsersLiked.push(userId)
                Sauce.updateOne({ _id: req.params.id}, { likes : likeNumber, usersLiked : newUsersLiked })
                    .then(() => res.status(200).json({message : 'Like ajouté!'}))
                    .catch(error => res.status(401).json({ error }))
                }
            })  
            .catch(error => res.status(500).json({ error }))      
    }
    if (req.body.like == 0) {
        Sauce.findOne({_id : req.params.id})
            .then((sauce) => {
                const usersLikedIds = sauce.usersLiked;
                const isLike = usersLikedIds.find( (el) => el === userId )
                if (isLike) {
                    let likeNumber2 = sauce.likes;
                    likeNumber2--;
                    let newUsersLiked2 = sauce.usersLiked;
                    newUsersLiked2 = newUsersLiked2.filter( el => el.value == userId );
                    Sauce.updateOne({ _id: req.params.id}, { likes : likeNumber2, usersLiked : newUsersLiked2 })
                        .then(() => res.status(200).json({message : 'Like supprimé!'}))
                        .catch(error => res.status(401).json({ error })) 
                } else {
                    let dislikeNumber2 = sauce.dislikes;
                    dislikeNumber2--;
                    let newUsersDisliked2 = sauce.usersDisliked;
                    newUsersDisliked2 = newUsersDisliked2.filter( el => el.value == userId )
                    Sauce.updateOne({ _id: req.params.id}, { dislikes : dislikeNumber2, usersDisliked : newUsersDisliked2 })
                    .then(() => res.status(200).json({message : 'Dislike supprimé!'}))
                    .catch(error => res.status(401).json({ error }))
                } 
            })  
            .catch(error => res.status(500).json({ error }))
    }
    if (req.body.like === -1) {
        Sauce.findOne({_id : req.params.id})
            .then((sauce) => {
                const usersDislikedIds = sauce.usersDisliked;
                if (!usersDislikedIds.find( (el) => el === userId )) {
                let dislikeNumber = sauce.dislikes;
                dislikeNumber++;
                let newUsersDisliked = sauce.usersDisliked;
                newUsersDisliked.push(userId)
                Sauce.updateOne({ _id: req.params.id}, { dislikes : dislikeNumber, usersDisliked : newUsersDisliked })
                    .then(() => res.status(200).json({message : 'Dislike ajouté!'}))
                    .catch(error => res.status(401).json({ error }))
                }
            })  
            .catch(error => res.status(500).json({ error }))
    }
};

exports.modifyOneSauce = (req, res, next) => {
    if (req.file) {
        Sauce.findOne({_id : req.params.id})
            .then((sauce) => {
                if (sauce.userId != req.auth.userId) {
                    res.status(403).json({ message : '403: unauthorized request'});
                } else {
                    const fileToDelete = sauce.imageUrl.split('/images/')[1];
                    fs.unlink(`images/${fileToDelete}`, () => { });
                    }
                })
            .catch((error) => {
                res.status(400).json({ error });
            });
    }
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  
    delete sauceObject._userId;
    Sauce.findOne({_id: req.params.id})
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({ message : '403: unauthorized request'});
            } else {
                Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifiée!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };

exports.deleteOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({message: '403: unauthorized request'});
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({_id: req.params.id})
                        .then(() => res.status(200).json({message: 'Sauce supprimée !'}))
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
};