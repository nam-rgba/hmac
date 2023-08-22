import style from "./host.module.css";
import Image from "../../Image";
import { Link } from "react-router-dom";
import { BiHome } from "react-icons/bi";
import { RiSendPlaneFill } from "react-icons/ri";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";

export default function Host() {
  // State for HMAC
  const [email, setEmail] = useState("");
  const [hmac, setHmac] = useState("");
  const [key, setkey] = useState("");

  // State for encrypt
  const [key2send, setKey2send] = useState("");
  const [publicKey, setPublicKey] = useState(""); // public key from server

  // Code for UI
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.GOOGLE_KEY_MAP,
  });

  const center = useMemo(
    () => ({ lat: 10.732680385612682, lng: 106.69933696671156 }),
    []
  );

  // send request to get Public key from server
  useEffect(() => {
    axios.get("/public-key").then(({ data }) => {
      setPublicKey(data);
      console.log(data);
    });
  }, []); // test done, got public key

  // Handle submit key
  const handleSubmitKey = async (e) => {
    e.preventDefault();
    try {
      const encryptedMessage = CryptoJS.AES.encrypt(
        key2send,
        publicKey
      ).toString();
      console.log(encryptedMessage);
      const plkey = await axios.post(
        "/receive",
        {
          encryptedMessage: encryptedMessage,
        },
        { withCredentials: true }
      );
      // Alert result
      alert(`${plkey.data.result}`);
      console.log(plkey.data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Generate HMAC with crypto-js function
  function generateHMAC(message, secretKey) {
    console.log(message);
    const hmac = CryptoJS.HmacSHA256(message, secretKey);
    const hmacBase64 = hmac.toString(CryptoJS.enc.Base64);
    return hmacBase64;
  }
  // Handle submit email
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Get secret key from .env file
    const secretKey = { key: import.meta.env.VITE_SECRET_KEY_HMAC };
    // Generate HMAC
    const clientHmac = generateHMAC(email, secretKey.key);
    setHmac(clientHmac);
    // Send HMAC to server to check and get response
    try {
      const mailRegis = await axios.post(
        "/hmacRegis",
        { email, clientHmac },
        { withCredentials: true }
      );
      // Alert result
      alert(`${mailRegis.data.result}, hmac code is ${mailRegis.data.hmac}`);
      console.log(mailRegis.data);
    } catch (error) {
      console.log(error);
      alert("Failed!");
    }
  };

  // Attacking HMAC use Brute Force function
  const handleAttack = async () => {
    for (let i = 0; i < 1000; i++) {
      //Generate space of key
      const potentialKey = i.toString();
      // Generate HMAC with each key
      const hmacGuess = generateHMAC(email, potentialKey);
      // Compare
      if (hmacGuess == hmac) {
        setkey(potentialKey);
        return;
      }
    }
  };

  return (
    <>
      <header className={style.header}>
        <Link to="/">
          <div className={style.branch}>
            <Image name="airbnb" type="svg" />
          </div>
        </Link>

        <div className={style.setup}>
          <div>Ready to Airbnb it?</div>
          <button className={style.btn}>
            {" "}
            <BiHome /> Airbnb Setup
          </button>
        </div>
      </header>

      <section className={style.earning}>
        <div className={style.txt1}>
          <div className={style.title1}>
            <span>Airbnb it.</span>
            <br />
            Send email with  HMAC
          </div>
          <div className={style.cash}>
            <span>First, </span>
            <br />       
          </div>

          {/* <div className={style.form2}>
            <form action="" onSubmit={handleSubmitKey}>
              <label htmlFor="email" className={style.invisible}>
                Key
              </label>
              <input
                type="number"
                id="key"
                name="key"
                placeholder="please just enter from 1-1000"
                value={key2send}
                onChange={(e) => {
                  setKey2send(e.target.value);
                }}
              />
              <button>SEND {key2send} to server</button>
            </form>
          </div> */}

          <div className={style.form}>
            <p>Contact with us by email</p>
            <form action="" onSubmit={handleSubmit}>
              <label htmlFor="email" className={style.invisible}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="youremail@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
              <button>
                <RiSendPlaneFill color="#ffffff" />
              </button>
            </form>
          </div>
          <div className={style.attack}>
            <button className={style.attackbtn} onClick={handleAttack}>
              Brute Force Attack
            </button>
            <div className={style.key}>
              The key was used is <span>{key}</span>{" "}
            </div>
          </div>
        </div>

        <div className={style.map}>
          {!isLoaded ? (
            <p>Loading...</p>
          ) : (
            <GoogleMap
              mapContainerClassName={style.map_container}
              center={center}
              zoom={16}
            >
              <MarkerF
                position={{ lat: 10.732680385612682, lng: 106.69933696671156 }}
              />
            </GoogleMap>
          )}
        </div>
      </section>

      <section className={style.easysetupS}></section>
    </>
  );
}
