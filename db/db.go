package db

import (
	//_ "github.com/go-sql-driver/mysql"
	"github.com/jinzhu/gorm"
	//_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"log"
)

type personModel struct {
	gorm.Model
	PersonId int    `json:"personId"`
	Name     string `json:"name"`
	Age      int    `json:"age"`
}

var db *gorm.DB

func init() {
	var err error
	//db, err = gorm.Open("mysql", "root:12345@/demo?charset=utf8&parseTime=True&loc=Local")
	db, err = gorm.Open("sqlite3", "testPerson.db")
	if err != nil {
		panic("failed to connect database")
	}
	//Migrate the schema
	db.AutoMigrate(&personModel{})
	//defer db.Close()
}

func AddDb(id int, name string, age int) {
	p := personModel{PersonId: id, Name: name, Age: age}
	//db.Save(&p)
	db.Create(&p)
}

func GetAllDb() {
	var ps []personModel
	db.Find(&ps)
	if len(ps) > 0 {
		for _, item := range ps {
			log.Println("~~~~~~~~id:", item.PersonId, " name:", item.Name, " age:", item.Age)
		}
	}
}

func GetDb(id int) {

}
