import "./OurStory.css";
import SidNavBar from "../../Components/SideNavBar/SideNavBar";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../assets/userContext";

const OurStory = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const { user } = useContext(UserContext);
  const { user_id } = useParams();

  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(""); // New state for profile photo
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchTravelAgencyDetails = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3000/api/v1/users/${user_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userData = response.data.data[0];
      setDescription(userData.description);
      setName(userData.username);
      setProfilePhoto(userData.profilephoto ); // Use default if no profile photo
    } catch (error) {
      console.error("Error fetching travel agency data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravelAgencyDetails();
  }, [user_id]);

  const updatedData = { name, description };

  const handleSaveChanges = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);

      const response = await axios.patch(
        `http://localhost:3000/api/v1/users/updateMe`,
        { description: updatedData.description, name: updatedData.name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );



      setIsEditing(false);
    } catch (error) {
      console.error("Error saving updated travel agency data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex">
      {/* Pass userId and user.role to SidNavBar */}
      <SidNavBar type={user.role} userId={user_id}></SidNavBar>

      <div className="about-us">
        <div className="profile-container1">
        <img
  src={profilePhoto.startsWith("http") ? profilePhoto : `http://localhost:3000/uploads/${profilePhoto}`}
  alt="Profile"
  className="profile-photo"
/>

          <h1 className="header-title">
            {isEditing && user.role === "travel_agency" && Number(user_id) === user.user_id ? (
              <input
                type="text"
                className="edit-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              name
            )}
          </h1>
        </div>
        <div className="header-underline"></div>
        <div className="description">
          {isEditing && user.role === "travel_agency" && Number(user_id) === user.user_id ? (
            <textarea
              className="edit-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          ) : (
            description
          )}
        </div>
        {user.role === "travel_agency" && Number(user_id) === user.user_id && (
          <div className="edit-controls">
            {isEditing ? (
              <>
                <button className="btn save-btn" onClick={handleSaveChanges}>
                  Save Changes
                </button>
                <button
                  className="btn cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="btn edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OurStory;
