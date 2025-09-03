import React, {useEffect, useState} from 'react';
import {FlatList, Pressable, ScrollView, Text, View} from 'react-native';

import {Icon, Overlay} from '@rn-vui/base';
import {Rows, Table} from 'react-native-reanimated-table';

import externalDataStyles from './externalData.styles';
import {toTitleCase} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import Loading from '../../shared/ui/Loading';

function TablesData({
                      editable,
                      initializeDelete,
                      spot,
                    }) {

  const [isTableVisible, setIsTableVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState({});
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // console.log('UE TablesData [isTableVisible]', isTableVisible);
    !isTableVisible && setSelectedTable({});
  }, [isTableVisible]);

  const closeTable = () => {
    setTableData([]);
    setIsTableVisible(false);
  };

  const getTableData = async () => {
    const numCols = tableData?.[0]?.length;
    const tableDataTrimmed = tableData.reduce((acc, r) => r.length === numCols ? [...acc, r] : acc, []);
    let cellMaxWidths = Array(numCols).fill(0);
    tableDataTrimmed.forEach((r) => {
      r.forEach((c, i) => {
        if (c.length > cellMaxWidths[i]) cellMaxWidths[i] = c.length;
      });
    });
    const cellWidths = cellMaxWidths.map(w => Math.min(w * 20, 150));

    return {cellWidths: cellWidths, tableDataTrimmed: tableDataTrimmed};
  };

  const renderTable = async () => {
    const {cellWidths, tableDataTrimmed} = await getTableData();
    const tableName = toTitleCase(selectedTable?.name.replace(/[_-]/g, ' '));
    return (
      <Overlay
        isVisible={isTableVisible}
        onBackdropPress={() => setIsTableVisible(false)}
        overlayStyle={loading ? externalDataStyles.loadingContainer : externalDataStyles.overlayContainer}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={externalDataStyles.modalContent}>
          <View style={externalDataStyles.modalHeader}>
            <Text style={externalDataStyles.modalTitle}>{loading ? 'Loading Table...' : tableName}</Text>
            <Pressable onPress={closeTable}>
              <Icon color={'#333'} name={'close'} size={30} type={'ionicon'}/>
            </Pressable>
          </View>

          {loading ? (
            <Loading isLoading={loading} style={{backgroundColor: 'transparent'}}/>
          ) : (
            <ScrollView horizontal>
              <View>
                <ScrollView>
                  <Table borderStyle={{borderWidth: 1, borderColor: '#ccc'}}>
                    <Rows
                      data={tableDataTrimmed}
                      textStyle={externalDataStyles.cellText}
                      widthArr={cellWidths}
                    />
                  </Table>
                </ScrollView>
              </View>
            </ScrollView>
          )}
        </View>
      </Overlay>
    );
  };

  const renderTableListItem = (table) => {
    return (
      <View>
        <Pressable
          loading={loading}
          onPress={() => selectTable(table)}
          style={({pressed}) => [externalDataStyles.listItem, {backgroundColor: pressed ? '#b4b6b8' : '#fff'}]}
        >
          <Text>{table.name}</Text>
          <Pressable
            onPress={() => initializeDelete('csv', table)}
            style={({pressed}) => [{backgroundColor: pressed ? '#b4b6b8' : 'transparent'}]}
          >
            <Icon
              color={'darkgrey'}
              containerStyle={externalDataStyles.iconContainer}
              name={'trash'}
              size={25}
              type={'font-awesome'}
            />
          </Pressable>
        </Pressable>
      </View>
    );
  };

  const selectTable = (table) => {
    setSelectedTable(table);
    setTableData([]); // clear old
    setIsTableVisible(true); // open immediately
    setLoading(true);

    setTimeout(() => {
      setTableData(table.data || []);
      setLoading(false);
    }, [0]);
  };

  return (
    <View style={{flex: 1}}>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No tables saved'}/>}
        data={spot.properties?.data?.tables}
        keyExtractor={item => item.id}
        listKey={'tables'}
        renderItem={({item}) => renderTableListItem(item)}
      />
      {isTableVisible && renderTable()}
    </View>
  );
}

export default TablesData;
