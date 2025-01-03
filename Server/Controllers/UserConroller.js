const express=require('express');
const client=require('../db');
const { console } = require('inspector/promises');
const bcrypt=require('bcrypt');
const multer=require('multer');
const jwt=require('jsonwebtoken');
const sharp=require('sharp');

function checkRole(user_id)
{
    client.query('SELECT role FROM users WHERE user_id=$1',[user_id],(err,result)=>
    {
        if(err)
        {
            console.log(err);
            return null;
        }
        else{
            return result.rows[0].role;
        }
    });
}
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload an image'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhotoMulter =async(req,res,next)=>
{ 
  upload.single('profilephoto');
  next();
}

exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.user_id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/images/users/${req.file.filename}`);
  next();
};

exports.updateUserPhoto = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const profilephoto = req.file.filename;
    await client.query('UPDATE users SET profilephoto=$1 WHERE user_id=$2', [profilephoto, user_id]);
    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
    });
  } catch (err) {
    console.error('Error updating user photo:', err);
    res.status(500).json({
      success: false,
      error: 'Error updating user photo',
    });
  }
}


exports.getAllUsers = async (req, res) => {
  try {
    client.query(
      "SELECT user_id,email,profilephoto,profilename,role,username FROM users",
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(400).send("Error in fetching data from users");
        } else {
          res.status(200).json(result.rows);
        }
      }
    );
  } catch (e) {
    console.log(e);
  }
};

exports.getAllTravelAgencies = async (req, res) => {
  try {
    client.query(
      "SELECT t.Location, t.Address, t.PhoneNumber, t.Email, t.Rate,t.Description,t.Country,s.email,s.profilephoto,s.profilename,t.TravelAgency_ID ,s.username,s.profilephoto,s.profilename FROM travelagency AS t,users AS s WHERE TravelAgency_ID=user_id",
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(400).json({
            success: false,
            error: err,
          });
        } else {
          res.status(200).json(result.rows);
        }
      }
    );
  } catch (e) {
    console.log(e);
  }
};

exports.getAllTravelers = async (req, res) => {
  try {
    client.query(
      "SELECT user_id,email,profilephoto,profilename,role,username,Points,NumberOfTrips FROM traveller,users WHERE traveller_id=user_id",
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(400).send("Error in fetching data");
        } else {
          res.status(200).json(result.rows);
        }
      }
    );
  } catch (e) {
    console.log(e);
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    client.query(
      "SELECT admin_id,email,profilephoto,profilename,role,username FROM admins,users WHERE admin_id=user_id",
      (err, result) => {
        if (err) {
          // console.log(err);
          res.status(400).json({
            success: false,
            error: "Error in fetching data",
          });
        } else {
          res.status(200).json(result.rows);
        }
      }
    );
  } catch (e) {
    console.log(e);
  }
};

exports.getUser=async(req,res)=>{
    try{
        const user_id=req.params.user_id;
        const userofrequest=req.user.role;
        if(!user_id)
        {
            return res.status(400).json({
                success:false,
                error:'Please provide Valid user_id'
            })
        }


        client.query('SELECT email,ProfilePhoto,profilename,role,username FROM users WHERE user_id=$1',[user_id],(err,result)=>
        {
            if(err)
            {
                console.log(err);
                return res.status(400).json({
                    success:false,
                    error:'Error in fetching data'
                })
            }
            else if(result.rows.length==0)
            {
                return res.status(404).json({
                    success:false,
                    error:'User not found'
                });
            }
            else{
                //search for the role of the user
                const role=result.rows[0].role;
                if(role==='travel_agency')
                {
                    client.query('SELECT t.Location, t.Address, t.PhoneNumber, t.Email, t.Rate,t.Description,t.Country,s.email AS useremail,s.profilephoto,s.profilename,s.username FROM travelagency AS t,users AS s WHERE TravelAgency_ID=user_id AND user_id=$1',[user_id],(err,result)=>
                        {
                            if(err)
                            {
                                console.log(err);
                            }
                            else
                            {
                                return res.status(200).json({
                                    success:true,
                                    data:result.rows,
                                    message:'User data fetched successfully',
                                });
                            }
                        });
                }
                else if(role==='traveller')
                {
                    client.query('SELECT email,profilephoto,profilename,role,username,t.Points,t.NumberOfTrips FROM traveller AS t,users WHERE traveller_id=user_id AND user_id=$1',[user_id],(err,result)=>
                    {
                        if(err)
                        {
                            console.log(err);
                        }
                        else{
                            return res.status(200).json({
                                success:true,
                                data:result.rows,
                            });
                        }
                    });
                }
                else{
                    if(userofrequest==='admin')
                    {
                    return res.status(200).json({
                        success:true,
                        data:result.rows,
                    });
                }
                else{
                    return res.status(401).json({
                        success:false,
                        error:'You are not authorized to view this data'
                    });
                }
                }
                
            }
        });
    }
    catch(e){
        console.log(e);
        res.status(400).json({
            success:false,
            error:'Error in fetching data'
        });
    }
};

exports.createUser = async (req, res) => {
  const { user_name, user_email, user_password, role } = req.body;

  // Validate input
  if (!user_name || !user_email || !user_password) {
    return res.status(400).json({
      success: false,
      error: "Please provide all details",
    });
  }

  try {
    await client.query("BEGIN");
    const hashedPassword = await bcrypt.hash(user_password, 12);
    delete req.body.user_password;

        // // Insert into the users table
        
        const userResult = await client.query(
            'INSERT INTO users(username, email, password,role) VALUES($1, $2, $3,$4) RETURNING user_id',
            [user_name, user_email, hashedPassword,role]
        );
        const userId = userResult.rows[0].user_id;

        if (role === 'traveller') {
            await client.query(
                'INSERT INTO traveller(traveller_id) VALUES($1) RETURNING *',
                [userId]
            );
        } else if (role === 'travel_agency') {
            const { phoneNumber, location, address, email, description, country } = req.body;
            // Validate travel agency specific fields
            if (!phoneNumber || !location || !address || !email || !description || !country) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    error: 'Please provide all travel agency details',
                });
            }

      await client.query(
        "INSERT INTO travelagency(travelagency_id, phonenumber, location, address, email, description, country) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [userId, phoneNumber, location, address, email, description, country]
      );
    } else if (role === "admin") {
      await client.query(
        "INSERT INTO admins(admin_id) VALUES($1) RETURNING *",
        [userId]
      );
    } else {
      return res.status(400).json({
        success: false,
        error: "Please provide correct role",
      });
    }

        // Commit the transaction if everything is fine
        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'User created successfully' });
    } catch (err) {
        // Rollback the transaction if there's an error
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: err });
    }
};


exports.DeleteUser=async(req,res)=>{
    try {
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({
                success: false,
                error: 'Please provide user_id',
            });
        }
        await client.query('BEGIN'); // Start transaction
        const rows=await client.query('DELETE FROM users WHERE user_id=$1', [user_id]);
        await client.query('COMMIT');
        if(rows.rowCount===0){
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        res.status(200).json({ success: true, message: 'User deleted successfully with id '+user_id });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting user:', err);
        res.status(500).send('Error in deleting user');
    }
}

exports.getMe = async (req, res, next) => {
  req.params.user_id = req.user.user_id;
  next();
};

exports.DeleteMe=async(req,res)=>{
    try {
        await client.query('BEGIN');
        const rows=await client.query('DELETE FROM users WHERE user_id=$1', [req.params.user_id]);
        await client.query('COMMIT');
        if(rows.rowCount===0){
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting user:', err);
        res.status(500).send('Error in deleting user');
    }
}
    
//will be edited in the future

exports.UpdateMe = async (req, res) => {
    const { profilephoto, profilename, username, previousPassword, newPassword, useremail } = req.body;

    try {
        await client.query('BEGIN');  // Start transaction

        
        if (username) {
            await client.query('UPDATE users SET username=$1 WHERE user_id=$2', [username, req.params.user_id]);
        }
        
        if (newPassword) {
            if (!previousPassword) {
                await client.query('ROLLBACK');  // Rollback transaction on error
                return res.status(400).json({ success: false, message: "Please provide previous password" });
            }
            
            const user = await client.query('SELECT password FROM users WHERE user_id=$1', [req.params.user_id]);
            const isMatch = await bcrypt.compare(previousPassword, user.rows[0].password);

            
            if (!isMatch) {
                await client.query('ROLLBACK');  // Rollback transaction on error
                return res.status(400).json({ success: false, message: "Incorrect password" });
            }
            
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await client.query('UPDATE users SET password=$1 WHERE user_id=$2', [hashedPassword, req.params.user_id]);

            console.log('Password updated successfully');

            const token = jwt.sign({ user_id: req.params.user_id }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRES_IN,
            });
            const cookieOptions = {
              expires: new Date(
                Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
              ),
              httpOnly: true,
              secure: false,// Set to true in production
              sameSite: 'none',
            };
    
            res.cookie("jwt", token, cookieOptions);
        }
        
        if (useremail) {
            await client.query('UPDATE users SET email=$1 WHERE user_id=$2', [useremail, req.params.user_id]);
        }

        if(req.user.role!=='admin')
        {
            if (profilephoto) {
                await client.query('UPDATE users SET profilephoto=$1 WHERE user_id=$2', [profilephoto, req.params.user_id]);
            }

            if (profilename) {
                await client.query('UPDATE users SET profilename=$1 WHERE user_id=$2', [profilename, req.params.user_id]);
            }
        }

        if(req.user.role==='travel_agency')
        {
            const { phoneNumber, location, address, email, description, country } = req.body;
            if (phoneNumber) {
                await client.query('UPDATE travelagency SET phonenumber=$1 WHERE travelagency_id=$2', [phoneNumber, req.params.user_id]);
            }
            if (location) {
                await client.query('UPDATE travelagency SET location=$1 WHERE travelagency_id=$2', [location, req.params.user_id]);
            }
            if (address) {
                await client.query('UPDATE travelagency SET address=$1 WHERE travelagency_id=$2', [address, req.params.user_id]);
            }
            if (email) {
                await client.query('UPDATE travelagency SET email=$1 WHERE travelagency_id=$2', [email, req.params.user_id]);
            }
            if (description) {
                await client.query('UPDATE travelagency SET description=$1 WHERE travelagency_id=$2', [description, req.params.user_id]);
            }
            if (country) {
                await client.query('UPDATE travelagency SET country=$1 WHERE travelagency_id=$2', [country, req.params.user_id]);
            }
        }
        await client.query('COMMIT');  // Commit transaction
        res.json({ success: true, message: "User updated successfully" });
    } catch (err) {
        await client.query('ROLLBACK');  // Rollback transaction on error
        console.error('Error updating user:', err);
        res.json({ success: false, message: err });
    } 
};

exports.getAvgRatingOfAllTravelAgencies = async (req, res) => {
  try{

    client.query(`SELECT AVG(RATE) FROM Review`,(err,result)=>{
      if(err){
        console.log(err);
        res.status(400).send("why");
      }
      else{
        res.status(200).json(result.rows);
      }
      });
  }
  catch(e)
  {
    console.log(e);
  }
}

exports.getfivemosttravellers = async (req, res) => {
  try{

    client.query(`SELECT 
    TR.TRAVELLER_ID AS user_id,
    U.username,
    U.email,
    U.ProfilePhoto,
    U.profilename,
    TR.Points,
    TR.NumberOfTrips,
    COALESCE(SUM(TK.NumberOfSeats), 0) AS TotalBookedSeats
FROM 
    Traveller TR
JOIN 
    Users U ON TR.TRAVELLER_ID = U.USER_ID -- Join Traveller with Users
LEFT JOIN 
    Tickets TK ON TR.TRAVELLER_ID = TK.TRAVELLER_ID -- Join with Tickets to calculate total booked seats
GROUP BY 
    TR.TRAVELLER_ID, U.username, U.email, TR.Points, TR.NumberOfTrips,U.profilename,U.ProfilePhoto
ORDER BY 
    TotalBookedSeats DESC
LIMIT 5;
`,(err, result) => {
        if (err) {
          console.log(err);
          res.status(400).send("Error in fetching data from users");
          }
        else {
          res.status(200).json(result.rows);
        }
        });
  }
  catch(e)
  {
    console.log(e);
  }
}

exports.getRegistrationUser=async(req,res)=>{
  try{
    const response=client.query(`SELECT DATE(created_at)AS date,Count(user_id) AS userCount FROM users GROUP BY DATE(created_at) ORDER BY DATE(created_at)`,(err,result)=>{
      if(err){
        console.log(err);
        res.status(400).send("Error in fetching data from users");
      }
      else{
        res.status(200).json(result.rows);
      }
    });
  }
  catch(e)
  {
    res.status(400).send("Error in fetching data from users");
    console.log(e);
  }
}



        


