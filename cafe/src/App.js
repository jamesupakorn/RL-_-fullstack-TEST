import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { Box, Tab, Tabs, Button } from '@mui/material';
import ReactCountdownClock from 'react-countdown-clock';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';

import Axios from "axios";
import $ from 'jquery';

function App() {
  const [countRowMenu, setcountRowMenu] = useState(1);
  const [usBev_id, setbev_id] = useState("");
  const [usCat_id, setcat_id] = useState("");
  const [usBev_desc, setbev_desc] = useState("");
  const [usPrice, setprice] = useState("");
  const [usDuration, setduration] = useState("");
  const [usType_desc, settype_desc] = useState("");
  const [usOpt_desc, setopt_desc] = useState("");
  const [usSwt_desc, setswt_desc] = useState("");
  const [usAddon_price, setaddon_price] = useState("");
  const [usAddon_Duration, setaddon_Duration] = useState("");
  const [usTimenow, setTimenow] = useState("");
  const [usDurationtotal, setdurationtotal] = useState(0);
  const [countdowntime, setcountdowntime] = useState(0);
  const [usPricetotal, setpricetotal] = useState(0);

  const [Menulist, setMenu] = useState([]);
  const [Coffeelist, setCoffee] = useState([]);
  const [Tealist, setTea] = useState([]);
  const [Softdrinklist, setSoftdrink] = useState([]);
  const [Optionlist, setOption] = useState([]);
  const [Sweetnesslist, setSweetness] = useState([]);
  const [Typelist, setType] = useState([]);
  const [Orderlist, setOrder] = useState([]);

  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newTabIndex) => {
    setTabIndex(newTabIndex);
  };
  const getMenu = () => {
    Axios.get("http://localhost:3300/categories").then((response) => {
      // console.log(response.data);
      setMenu(response.data);
    });

  };


  const getCoffee = () => {
    Axios.get("http://localhost:3300/beveragebycatid/1").then((response) => {
      // console.log(response.data);
      setCoffee(response.data);
      setTea([]);
      setSoftdrink([]);
    });

  };
  const getTea = () => {
    Axios.get("http://localhost:3300/beveragebycatid/2").then((response) => {
      // console.log(response.data);
      setCoffee([]);
      setTea(response.data);
      setSoftdrink([]);
    });

  };
  const getSoftdrink = () => {
    Axios.get("http://localhost:3300/beveragebycatid/3").then((response) => {
      // console.log(response.data);
      setCoffee([]);
      setTea([]);
      setSoftdrink(response.data);
    });

  };
  const getSweetness = () => {
    Axios.get("http://localhost:3300/sweetness").then((response) => {
      //  console.log(response.data);
      setSweetness(response.data);
    });

  };
  const getType = () => {
    Axios.get("http://localhost:3300/Type").then((response) => {
      //  console.log(response.data);
      setType(response.data);
    });

  };
  const getOption = () => {
    Axios.get("http://localhost:3300/option").then((response) => {
      //  console.log(response.data);
      setOption(response.data);
    });

  };

  const confirmOrder = () => {
    $('#Menu').css("display", "none");
    $('#order').css("display", "none");
    $('#waitOrder').css("display", "");
    setcountdowntime(usDurationtotal);

  };

  const handleRemoveItem = (event) => {
    const name = event.target.getAttribute("name")
    // console.log(Orderlist);
    setOrder(Orderlist.filter(item => item.NumRow !== name));
    // console.log(Orderlist);
  };

  useEffect(() => {
    getMenu();
    getSweetness();
    getOption();
    getType();
  }, []);

  function complete() {
    if(Orderlist.length!==0){
      window.location.reload();
    }
      
  }
  function cleanAll() {
    $('[id^=bev_]').css("background-color", "transparent");
    $('[id^=bev_]').css("color", "#1976d2");
    $('[id^=type_]').css("background-color", "transparent");
    $('[id^=type_]').css("color", "#1976d2");
    $('[id^=swt_]').css("background-color", "transparent");
    $('[id^=swt_]').css("color", "#1976d2");
    setbev_id("");
    setcat_id("");
    setbev_desc("");
    setprice("");
    setduration("");
    settype_desc("");
    setopt_desc("");
    setswt_desc("");
    setaddon_price("");
    setaddon_Duration("");

  }
  function hideBnt() {
    $('[id^=opt_]').css("display", "none");
    $('[id^=swt_]').css("display", "none");
    $('[id^=type_]').css("display", "none");
  }
  function ChooseBeverage(catid, bevid, bevdesc, optdata, swtdata, typedata, price, duration) {
    setbev_id(bevid);
    setbev_desc(bevdesc);
    setprice(price);
    setduration(duration);
    setcat_id(catid)
    $('[id^=bev_]').css("background-color", "transparent");
    $('[id^=bev_]').css("color", "#1976d2");
    $(`#bev_${bevid}`).css("background-color", "#1976d2");
    $(`#bev_${bevid}`).css("color", "#fff");
    if (optdata !== null && optdata !== '') {
      var arrOptdata = JSON.parse(optdata.replace(/^\/|\/$/g, ''));
      for (const optid of arrOptdata) {
        $(`#opt_${optid.opt_id}`).css("display", "");
        $(`#opt_${optid.opt_id}`).css("background-color", "transparent");
        $(`#opt_${optid.opt_id}`).css("color", "#1976d2");
      }
    }
    if (typedata !== null && typedata !== '') {
      var arrTypedata = JSON.parse(typedata.replace(/^\/|\/$/g, ''));
      for (const typeid of arrTypedata) {
        $(`#type_${typeid.type_id}`).css("display", "");
        $(`#type_${typeid.type_id}`).css("background-color", "transparent");
        $(`#type_${typeid.type_id}`).css("color", "#1976d2");
        if (catid === 3) {
          $(`#type_${typeid.type_id}`).click();
        }
      }
    }
    if (swtdata !== null && swtdata !== '') {
      var arrSwtdata = JSON.parse(swtdata.replace(/^\/|\/$/g, ''));
      for (const swtid of arrSwtdata) {
        $(`#swt_${swtid.swt_id}`).css("display", "");
        $(`#swt_${swtid.swt_id}`).css("background-color", "transparent");
        $(`#swt_${swtid.swt_id}`).css("color", "#1976d2");
      }
    } else {
      setswt_desc("");
    }
  }
  function ChooseType(typeid, typedesc, addonprice, addonDuration) {
    $('[id^=type_]').css("background-color", "transparent");
    $('[id^=type_]').css("color", "#1976d2");
    $(`#type_${typeid}`).css("background-color", "#1976d2");
    $(`#type_${typeid}`).css("color", "#fff");
    settype_desc(typedesc);
    setaddon_price(addonprice);
    setaddon_Duration(addonDuration);
  }
  function ChooseSweetness(swtid, swtdesc) {
    $('[id^=swt_]').css("background-color", "transparent");
    $('[id^=swt_]').css("color", "#1976d2");
    $(`#swt_${swtid}`).css("background-color", "#1976d2");
    $(`#swt_${swtid}`).css("color", "#fff");
    setswt_desc(swtdesc);
  }
  function ChooseOption(optid, optdesc) {
    $('[id^=opt_]').css("background-color", "transparent");
    $('[id^=opt_]').css("color", "#1976d2");
    $(`#opt_${optid}`).css("background-color", "#1976d2");
    $(`#opt_${optid}`).css("color", "#fff");
    setopt_desc(optdesc);

  }
  function addOrderClick(usBev_id, usBev_desc, usPrice, usDuration, usType_desc, usOpt_desc, usSwt_desc, usAddon_price, usAddon_Duration) {
    if (countRowMenu !== "") {
      setcountRowMenu(countRowMenu + 1);
    }
    $('[id^=order]').css("display", "");
    var json = `{"NumRow": "` + countRowMenu + `" ,"Productid": "${usBev_id.usBev_id}","Product": "${usBev_desc.usBev_desc}", "Price": ${usPrice.usPrice + usAddon_price.usAddon_price}, "Duration": ${usDuration.usDuration + usAddon_Duration.usAddon_Duration},"Sweetness": "${usSwt_desc.usSwt_desc}","Option": "${usOpt_desc.usOpt_desc}","Pro_Type": "${usType_desc.usType_desc}"}`;
    var arr = JSON.parse(json.replace(/^\/|\/$/g, ''));
    setOrder([...Orderlist, arr]);
    cleanAll();
    hideBnt();
    setdurationtotal(usDurationtotal + usDuration.usDuration + usAddon_Duration.usAddon_Duration);
    setpricetotal(usPricetotal + usPrice.usPrice + usAddon_price.usAddon_price);
  };
  return (
    <div className="App container">
      <h1>Sukorn Coffee</h1>
      <div id="Menu">
        <Box>
          <Box>
            <Tabs value={tabIndex} onChange={handleTabChange}>
              {Menulist.map((val, key) => {
                // console.log(key);
                return (
                  <Tab label={val.cat_desc} onClick={() => hideBnt()} />
                );

              })}
            </Tabs>
          </Box>
        </Box>
        <hr />
        <Box>
          {Menulist.map((Menuval, key) => {
            // console.log(key);
            if (key === tabIndex) {
              if (tabIndex === 0) {
                getCoffee();
                return (
                  <div className="Coffeelist">
                    {Coffeelist.map((Cofval, key) => {
                      return (
                        <><Button
                          id={"bev_" + Cofval.bev_id}
                          variant="outlined"
                          style={{ marginLeft: '.5rem' }}
                          onClick={() => ChooseBeverage(Cofval.cat_id, Cofval.bev_id, Cofval.bev_desc, Menuval.cat_option, Menuval.cat_sweetness, Menuval.cat_type, Cofval.price, Cofval.duration)}
                        >
                          {Cofval.bev_desc}
                        </Button>
                          <p className="card-text">Price: {Cofval.price}</p></>
                      );
                    })}
                  </div>
                );
              } if (tabIndex === 1) {
                getTea();
                return (
                  <div className="Tealist">
                    {Tealist.map((Teaval, key) => {
                      return (
                        <><Button
                          id={"bev_" + Teaval.bev_id}
                          variant="outlined"
                          style={{ marginLeft: '.5rem' }}
                          onClick={() => ChooseBeverage(Teaval.cat_id, Teaval.bev_id, Teaval.bev_desc, Menuval.cat_option, Menuval.cat_sweetness, Menuval.cat_type, Teaval.price, Teaval.duration)}
                        >
                          {Teaval.bev_desc}
                        </Button>
                          <p className="card-text">Price: {Teaval.price}</p></>
                      );
                    })}
                  </div>
                );
              } if (tabIndex === 2) {
                getSoftdrink();
                return (
                  <div className="Softdrinklist">
                    {Softdrinklist.map((Softval, key) => {
                      return (
                        <><Button
                          id={"bev_" + Softval.bev_id}
                          variant="outlined"
                          style={{ marginLeft: '.5rem' }}
                          onClick={() => ChooseBeverage(Softval.cat_id, Softval.bev_id, Softval.bev_desc, Menuval.cat_option, Menuval.cat_sweetness, Menuval.cat_type, Softval.price, Softval.duration)}
                        >
                          {Softval.bev_desc}
                        </Button>
                          <p className="card-text">Price: {Softval.price}</p></>
                      );
                    })}
                  </div>
                );

              }
            }
          })}
        </Box>
        <br />
        <Box>
          {Typelist.map((val, key) => {
            return (
              <Button
                id={"type_" + val.type_id}
                style={{ marginLeft: '.5rem', display: 'none' }}
                variant="outlined"
                onClick={() => ChooseType(val.type_id, val.type_desc, val.addon_price, val.addon_duration)}
              >
                {val.type_id === 2 ? (val.type_desc + " (+5)") : (val.type_desc)}
              </Button>);
          })}
        </Box>
        <br />
        <Box>
          {Sweetnesslist.map((val, key) => {
            return (
              <Button
                id={"swt_" + val.swt_id}
                style={{ marginLeft: '.5rem', display: 'none' }}
                variant="outlined"
                onClick={() => ChooseSweetness(val.swt_id, val.swt_desc)}
              >
                {val.swt_desc}
              </Button>);
          })}
        </Box>
        <br />
        <Box>
          {Optionlist.map((val, key) => {
            return (
              <Button
                id={"opt_" + val.opt_id}
                style={{ marginLeft: '.5rem', display: 'none' }}
                variant="outlined"
                onClick={() => ChooseOption(val.opt_id, val.opt_desc)}
              >
                {val.opt_desc}
              </Button>);
          })}
        </Box>
        <hr />
        <Button
          color="secondary"
          variant="outlined"
          onClick={() => addOrderClick({ usBev_id }, { usBev_desc }, { usPrice }, { usDuration }, { usType_desc }, { usOpt_desc }, { usSwt_desc }, { usAddon_price }, { usAddon_Duration })}

        >
          Add
        </Button>
        <br /><br />

      </div>
      <div id="order">
        {Orderlist.length !== 0 &&
          <div class="row">
            <div class="col-md-1">
              <div class="p-3 mb-3 bg-info text-dark">No.</div>
            </div>
            <div class="col-md-2">
              <div class="p-3 mb-3 bg-info text-dark">Menu</div>
            </div>
            <div class="col-md-2">
              <div class="p-3 mb-3 bg-info text-dark">Type</div>
            </div>
            <div class="col-md-2">
              <div class="p-3 mb-3 bg-info text-dark">Sweet</div>
            </div>
            <div class="col-md-2">
              <div class="p-3 mb-3 bg-info text-dark">Option</div>
            </div>
            <div class="col-md-1">
              <div class="p-3 mb-3 bg-info text-dark">Price</div>
            </div>
            <div class="col-md-1">
              <div class="p-3 mb-3 bg-info text-dark">Time</div>
            </div>
            <div class="col-md-1">
              <div class="p-3 mb-3 bg-info text-dark"><HighlightOffIcon style={{ color: '#0dcaf0' }} /></div>
            </div>
          </div>
        }
        <div class="row">
          {Orderlist.map((val, key) => {
            return (
              <>
                <div class="col-md-1">
                  <div class="p-3 mb-3 bg-primary text-white">{key + 1}</div>
                </div>
                <div class="col-md-2">
                  <div class="p-3 mb-3 bg-primary text-white">{val.Product === "" ? "None" : val.Product}</div>
                </div>
                <div class="col-md-2">
                  <div class="p-3 mb-3 bg-primary text-white">{val.Pro_Type === "" ? "None" : val.Pro_Type}</div>
                </div>
                <div class="col-md-2">
                  <div class="p-3 mb-3 bg-primary text-white">{val.Sweetness === "" ? "None" : val.Sweetness}</div>
                </div>
                <div class="col-md-2">
                  <div class="p-3 mb-3 bg-primary text-white">{val.Option === "" ? "None" : val.Option}</div>
                </div>
                <div class="col-md-1">
                  <div class="p-3 mb-3 bg-primary text-white">{val.Price === "" ? "None" : val.Price}</div>
                </div>
                <div class="col-md-1">
                  <div class="p-3 mb-3 bg-primary text-white">{val.Duration === "" ? "None" : val.Duration}</div>
                </div>
                <div class="col-md-1">
                  <Button
                    name={val.NumRow}
                    onClick={handleRemoveItem}
                    className="p-3 mb-3 bg-primary text-white"
                  >
                    <HighlightOffIcon name={val.NumRow} onClick={handleRemoveItem} style={{ color: '#fff' }} />
                  </Button>
                </div>
              </>
            );
          })}
        </div>

        {Orderlist.length !== 0 &&
          <div class="row">
            <div class="col-md-9">
              <div class="p-3 mb-3 bg-info text-dark">Total</div>
            </div>
            <div class="col-md-1">
              <div class="p-3 mb-3 bg-info text-dark">{usPricetotal}</div>
            </div>
            <div class="col-md-1">
              <div class="p-3 mb-3 bg-info text-dark">{usDurationtotal}</div>
            </div>
            <div class="col-md-1">
              <Button
                onClick={confirmOrder}
                className="p-3 mb-3 bg-info text-white"
              >
                <ShoppingCartCheckoutIcon onClick={confirmOrder} style={{ color: '#000' }} />
              </Button>
            </div>
          </div>
        }
      </div>
      <div class="row" id="waitOrder" style={{display: 'none'}}>
      <div class="row">
        <div class="col-md-1"></div>
        <div align="center" style={{marginLeft: '3rem'}} class="col-md-6">
          <ReactCountdownClock
            seconds={countdowntime}
            color="#000" alpha={0.9}
            size={300}
            onComplete={complete} />
        </div>
        </div>
        <br/>
        <div class="row">
        <div class="col-md-3"></div>
        <div align="center" class="col-md-6">
          <h1>Please wait for a moment to receive the product.</h1>
        </div>
        </div>
      </div>
    </div>
  );
}

export default App;
